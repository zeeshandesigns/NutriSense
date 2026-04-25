"""
Quick API test — run while the server is running on localhost:5000.

Usage:
    python test_api.py
    python test_api.py --url https://nutrisense-api.onrender.com  # against production
"""

import argparse
import io
import json
import sys

import requests
from PIL import Image

BASE = "http://localhost:5000"


def ok(label):   print(f"  [OK] {label}")
def fail(label): print(f"  [FAIL] {label}"); sys.exit(1)


def test_health(base):
    print("\n1. GET /health")
    r = requests.get(f"{base}/health", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data["status"] == "ok", f"status != ok: {data}"
    assert "classes" in data
    ok(f"status=ok  classes={data['classes']}  model_loaded={data['model_loaded']}")
    return data


def test_classes(base):
    print("\n2. GET /classes")
    r = requests.get(f"{base}/classes", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict) and len(data) > 0
    sample = list(data.items())[:3]
    ok(f"{len(data)} classes  sample: {sample}")
    return data


def test_predict(base, user_goal="muscle_gain"):
    print(f"\n3. POST /predict  (user_goal={user_goal})")

    # Generate a synthetic 224x224 RGB image — no real photo needed for mock mode
    img = Image.new("RGB", (224, 224), color=(180, 100, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    r = requests.post(
        f"{base}/predict",
        files={"image": ("test.jpg", buf, "image/jpeg")},
        data={"user_goal": user_goal},
        timeout=20,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()

    # Validate response shape
    assert "top_prediction" in data, "Missing top_prediction"
    assert "label" in data["top_prediction"]
    assert "confidence" in data["top_prediction"]
    assert "top_3" in data and len(data["top_3"]) == 3
    assert "low_confidence" in data
    assert "nutrition" in data
    assert "insight" in data
    assert "processing_time_ms" in data

    tp = data["top_prediction"]
    n  = data["nutrition"]
    ok(f"label={tp['label']}  confidence={tp['confidence']}")
    ok(f"low_confidence={data['low_confidence']}")
    ok(f"nutrition: {n['calories']} kcal  {n['protein']}g protein")
    ok(f"insight: \"{data['insight'][:80]}...\"")
    ok(f"processing_time_ms={data['processing_time_ms']}")

    if "gradcam_sample_url" in data:
        ok(f"gradcam_sample_url present")

    return data


def test_predict_no_image(base):
    print("\n4. POST /predict  (no image — expect 400)")
    r = requests.post(f"{base}/predict", timeout=10)
    assert r.status_code == 400
    assert "error" in r.json()
    ok(f"400 returned with error message: {r.json()['error']}")


def test_predict_all_goals(base):
    print("\n5. POST /predict  (all three user_goal values)")
    for goal in ["weight_loss", "muscle_gain", "curious"]:
        img = Image.new("RGB", (224, 224), color=(120, 160, 80))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        r = requests.post(
            f"{base}/predict",
            files={"image": ("test.jpg", buf, "image/jpeg")},
            data={"user_goal": goal},
            timeout=20,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["insight"], "Insight is empty"
        ok(f"goal={goal}  label={data['top_prediction']['label']}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=BASE)
    args = parser.parse_args()

    print(f"Testing API at: {args.url}")

    health = test_health(args.url)
    classes = test_classes(args.url)
    result = test_predict(args.url, user_goal="muscle_gain")
    test_predict_no_image(args.url)
    test_predict_all_goals(args.url)

    print("\n" + "="*50)
    print("All tests passed.")
    print(f"  Classes: {health['classes']}")
    print(f"  Model loaded: {health['model_loaded']} (False = mock mode)")
    print(f"  Sample prediction: {result['top_prediction']['label']} ({result['top_prediction']['confidence']})")
    print("="*50)


if __name__ == "__main__":
    main()
