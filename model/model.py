"""
EfficientNetB0 for NutriSense AI.
Replaces the classifier head and exposes freeze/unfreeze helpers
for two-phase transfer learning.
"""

import torch.nn as nn
from torchvision import models
from torchvision.models import EfficientNet_B0_Weights


def build_model(num_classes: int) -> nn.Module:
    model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
    in_features = model.classifier[1].in_features  # 1280
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    return model


def freeze_backbone(model: nn.Module):
    """Phase 1: only the classifier head trains."""
    for param in model.parameters():
        param.requires_grad = False
    for param in model.classifier.parameters():
        param.requires_grad = True


def unfreeze_last_n(model: nn.Module, n: int = 20):
    """Phase 2: unfreeze last n feature layers + classifier."""
    for layer in list(model.features.children())[-n:]:
        for param in layer.parameters():
            param.requires_grad = True
    for param in model.classifier.parameters():
        param.requires_grad = True


def count_trainable(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
