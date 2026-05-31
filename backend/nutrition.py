import json

from config import NUTRITION_DB_PATH

_db: dict[str, dict] = {}

_FALLBACK = {
    "calories": 0,
    "protein":  0,
    "carbs":    0,
    "fat":      0,
    "note":     "Nutrition data unavailable",
}


def load_nutrition_db():
    global _db
    with open(NUTRITION_DB_PATH, encoding="utf-8") as f:
        _db = json.load(f)
    print(f"Nutrition DB loaded: {len(_db)} entries")


def get_nutrition(food_label: str) -> dict:
    key = food_label.lower().replace(" ", "_").replace("-", "_")
    if key in _db:
        return _db[key]
    base = key.rsplit("_", 1)[0]
    if base in _db:
        return _db[base]
    return _FALLBACK
