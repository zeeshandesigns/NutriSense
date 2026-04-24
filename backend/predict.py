import json
import time

import numpy as np
import onnxruntime as ort
from PIL import Image
from io import BytesIO

from config import CLASS_INDEX_PATH, CONFIDENCE_THRESHOLD, MODEL_PATH

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

_session: ort.InferenceSession | None = None
_class_index: dict[str, str] = {}


def load_model():
    global _session, _class_index
    _session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
    with open(CLASS_INDEX_PATH, encoding="utf-8") as f:
        _class_index = json.load(f)
    print(f"Model loaded: {MODEL_PATH} ({len(_class_index)} classes)")


def _preprocess(image_bytes: bytes) -> np.ndarray:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    arr = arr.transpose(2, 0, 1)        # HWC → CHW
    return arr[np.newaxis, ...]          # add batch dim


def _softmax(logits: np.ndarray) -> np.ndarray:
    e = np.exp(logits - logits.max())
    return e / e.sum()


def run_inference(image_bytes: bytes) -> dict:
    t0 = time.perf_counter()
    tensor = _preprocess(image_bytes)
    input_name = _session.get_inputs()[0].name
    logits = _session.run(None, {input_name: tensor})[0][0]
    probs = _softmax(logits)
    top3_idx = probs.argsort()[::-1][:3]
    top3 = [
        {"label": _class_index[str(i)], "confidence": round(float(probs[i]), 4)}
        for i in top3_idx
    ]
    return {
        "top_prediction": top3[0],
        "top_3": top3,
        "low_confidence": top3[0]["confidence"] < CONFIDENCE_THRESHOLD,
        "processing_time_ms": round((time.perf_counter() - t0) * 1000),
    }


def get_class_index() -> dict:
    return _class_index
