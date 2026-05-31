"""
Grad-CAM implementation for EfficientNetB0.
Hooks into model.features[-1] (last conv block), computes gradient-weighted
feature maps, overlays a jet heatmap on the original image.

Used by evaluate.py to generate precomputed heatmap PNGs that are then
uploaded to Supabase Storage. The Flask backend serves these as static URLs —
it does NOT load PyTorch at runtime.
"""

import base64
from io import BytesIO

import matplotlib.cm as cm
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


def _preprocess(image: Image.Image) -> torch.Tensor:
    t = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])
    return t(image).unsqueeze(0)


def _jet_colormap(gray: np.ndarray) -> np.ndarray:
    """Maps (H, W) uint8 → (H, W, 3) RGB using jet palette."""
    colored = cm.jet(gray / 255.0)[:, :, :3]
    return (colored * 255).astype(np.uint8)


def generate_gradcam(
    model: torch.nn.Module,
    image: Image.Image,
    target_class: int | None = None,
    alpha: float = 0.45,
) -> Image.Image:
    """
    Returns a PIL Image with the Grad-CAM heatmap blended over the original.
    If target_class is None, uses the top predicted class.
    """
    model.eval()
    device = next(model.parameters()).device

    activations: list[torch.Tensor] = []
    gradients:   list[torch.Tensor] = []

    def fwd_hook(_, __, out):
        activations.append(out.detach())

    def bwd_hook(_, __, grad_out):
        gradients.append(grad_out[0].detach())

    target_layer = model.features[-1]
    fh = target_layer.register_forward_hook(fwd_hook)
    bh = target_layer.register_full_backward_hook(bwd_hook)

    tensor = _preprocess(image).to(device)
    tensor.requires_grad_(True)
    output = model(tensor)

    if target_class is None:
        target_class = int(output.argmax(dim=1).item())

    model.zero_grad()
    output[0, target_class].backward()

    fh.remove()
    bh.remove()

    act  = activations[0].squeeze(0)           # (C, H, W)
    grad = gradients[0].squeeze(0)             # (C, H, W)
    weights = grad.mean(dim=(1, 2))            # (C,)
    cam = F.relu((weights[:, None, None] * act).sum(dim=0))

    # Normalise
    cam_min, cam_max = cam.min(), cam.max()
    if cam_max > cam_min:
        cam = (cam - cam_min) / (cam_max - cam_min)
    cam_np = (cam.cpu().numpy() * 255).astype(np.uint8)

    # Resize to original image size
    cam_resized = np.array(
        Image.fromarray(cam_np).resize(image.size, Image.BILINEAR)
    )

    heatmap = Image.fromarray(_jet_colormap(cam_resized))
    blended = Image.blend(image.convert("RGB"), heatmap, alpha=alpha)
    return blended


def gradcam_to_base64(
    model: torch.nn.Module,
    image: Image.Image,
    target_class: int | None = None,
) -> str:
    heatmap = generate_gradcam(model, image, target_class)
    buf = BytesIO()
    heatmap.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")
