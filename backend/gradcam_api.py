import json
import os

from config import GRADCAM_INDEX_PATH

_index: dict[str, str] = {}


def load_gradcam_index():
    global _index
    if not os.path.exists(GRADCAM_INDEX_PATH):
        print("No gradcam_index.json found — Grad-CAM URLs will not be served")
        return
    with open(GRADCAM_INDEX_PATH, encoding="utf-8") as f:
        _index = json.load(f)
    print(f"Grad-CAM index loaded: {len(_index)} entries")


def get_gradcam_url(food_label: str) -> str | None:
    return _index.get(food_label) or _index.get(food_label.replace(" ", "_"))
