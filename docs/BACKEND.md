# NutriSense AI — Backend & AI Build Guide

> **Status:** This document is a placeholder. Full phase-by-phase content will be written in the next session after the frontend document is approved and the team starts building.
>
> **For the AI:** Do not start building anything from this file yet. Wait for the full version.
>
> **For the developer:** Give this file + `CONTEXT.md` to your AI at the start of each backend session.

---

## Your Role

You are building the backend and ML pipeline for NutriSense AI:

1. **ML pipeline** — Dataset curation, EfficientNetB0 training, ablation study, Grad-CAM evaluation, ONNX export (runs on Kaggle)
2. **Flask REST API** — Serves predictions via `/predict`, `/health`, `/classes` (runs on Render)
3. **Supabase setup** — Run the schema SQL, create storage bucket, populate gradcam_index.json

You are NOT building the mobile app or web dashboard — that is the frontend team's responsibility.

---

## What the Frontend Expects From You

The frontend calls these endpoints. Do not change the response shape without coordinating with the frontend team.

### POST /predict

```json
// Response 200
{
  "top_prediction": { "label": "chicken_karahi", "confidence": 0.91 },
  "top_3": [
    { "label": "chicken_karahi", "confidence": 0.91 },
    { "label": "chicken_handi",  "confidence": 0.06 },
    { "label": "butter_chicken", "confidence": 0.03 }
  ],
  "low_confidence": false,
  "nutrition": { "calories": 320, "protein": 28, "carbs": 8, "fat": 19 },
  "insight": "Karahi is a high-protein dish...",
  "gradcam_sample_url": "https://...supabase.co/storage/...",
  "processing_time_ms": 1240
}
```

### GET /health → `{ "status": "ok", "model_loaded": true, "classes": 100 }`
### GET /classes → `{ "0": "biryani", "1": "chicken_karahi", ... }`

---

## Planned Phases

### Phase 1 — Dataset Curation

- `scrape.py` — `icrawler`-based scraper for 15–20 Pakistani gap-fill classes
- `curate_classes.py` — merge Food-101 + Khana (2025) + DeshiFoodBD + scraped + Pakistani dataset; deduplicate class names; drop classes with < 300 images; output `class_index.json` and `dataset_stats.csv`
- `nutrition_db.json` — manual population from USDA FoodData Central for all ~100 classes

### Phase 2 — Model Training (Kaggle)

- `dataset.py` — PyTorch Dataset class; augmentation pipeline; class weight computation for imbalanced classes
- `model.py` — EfficientNetB0 with replaced classifier head; `freeze_backbone()` and `unfreeze_last_n(n)` helpers
- `train.py` — Two-phase training: Phase 1 (5 epochs, frozen backbone, LR=1e-3) → Phase 2 (15 epochs, last 20 layers unfrozen, LR=1e-4, early stopping patience=3)
- `nutrisense_training.ipynb` — Kaggle notebook orchestrating the full pipeline

### Phase 3 — Ablation + Evaluation

- `ablation.py` — Train EfficientNetB0, MobileNetV2, ResNet50 on identical splits; output `ablation_results.csv`
- `evaluate.py` — Top-1 / top-3 accuracy overall and per class; confusion matrix PNG; per-class accuracy chart; `results.json`
- `gradcam.py` — Grad-CAM implementation hooking into `model.features[-1]`; generate heatmap PNGs for sample images; upload to Supabase Storage `gradcam` folder; produce `gradcam_index.json` mapping label → public URL

### Phase 4 — Export + Flask API

- `export.py` — Load `.pth` checkpoint → `torch.onnx.export()` → `model.onnx`
- `app.py` — Flask entry point; load ONNX model, nutrition DB, Grad-CAM index on startup; CORS enabled
- `predict.py` — ONNX inference; image preprocessing (224×224, ImageNet normalisation); softmax; top-3 extraction; confidence threshold check
- `nutrition.py` — Local JSON lookup with underscore/space-tolerant key matching; fallback for missing entries
- `insights.py` — Gemini `gemini-1.5-flash` API call; structured prompt with goal context; 2-3 sentence response
- `gradcam_api.py` — Lookup precomputed Grad-CAM URL from `gradcam_index.json`; no PyTorch at runtime (keeps Render under 512MB RAM)
- `routes/predict_bp.py` — POST /predict handler
- `routes/health_bp.py` — GET /health handler
- `routes/classes_bp.py` — GET /classes handler

### Phase 5 — Deployment

- `Procfile` — `web: gunicorn app:app`
- `requirements.txt` — flask, flask-cors, onnxruntime, Pillow, numpy, requests, python-dotenv, gunicorn (no torch in production)
- Render setup: Python web service; persistent disk for model files; environment variables
- Supabase: run `docs/CONTEXT.md` schema SQL; create `scan-images` bucket (public read); create `gradcam` folder in Storage
- Upload `model.onnx`, `class_index.json`, `nutrition_db.json`, `gradcam_index.json` to Render disk

---

## Key Technical Constraints

| Constraint | Value | Reason |
|---|---|---|
| Render free RAM | 512 MB | ONNX-only inference — do NOT load PyTorch in the Flask process |
| Confidence threshold | 0.70 | Below this → `low_confidence: true` → frontend shows picker |
| Image input size | 224 × 224 | EfficientNetB0 standard; must match training preprocessing |
| ImageNet normalisation | mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225] | Must match training transforms exactly |
| Gemini model | `gemini-1.5-flash` | Free tier; do not use gemini-pro (paid) |
| Grad-CAM target layer | `model.features[-1]` | Last convolutional block of EfficientNetB0 |
| Training GPU | Kaggle P100 or T4 | Free; 30h/week limit |

---

## Environment Variables

```
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MODEL_PATH=./model.onnx
CLASS_INDEX_PATH=./class_index.json
NUTRITION_DB_PATH=./nutrition_db.json
GRADCAM_INDEX_PATH=./gradcam_index.json
CONFIDENCE_THRESHOLD=0.70
```

---

## Verification Checklist (to fill in after deployment)

- [ ] `GET /health` → `{ "status": "ok", "model_loaded": true, "classes": 100 }`
- [ ] `POST /predict` with a karahi photo → correct label, confidence ≥ 0.70
- [ ] `POST /predict` with ambiguous food → `low_confidence: true`, correct top-3
- [ ] `nutrition` field populated for known classes; graceful fallback for unknowns
- [ ] `insight` field: 2-3 coherent sentences in English, culturally appropriate
- [ ] `gradcam_sample_url` present for at least 20 common classes
- [ ] Render deployment: cold start < 30 seconds; prediction < 3 seconds
- [ ] Ablation results saved: EfficientNetB0 outperforms MobileNetV2 and ResNet50

---

*Full phase content with code specifications will be written in the next session.*
