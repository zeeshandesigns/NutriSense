# 1. Application

## 1.1 Project Overview

**NutriSense AI** is a web-based food-recognition system trained specifically on Pakistani and South Asian cuisine. A user uploads a photograph of a dish from a web browser, and the system returns the dish name, calories / protein / carbs / fat per standard serving, and a short, goal-personalised nutritional insight — without any manual entry.

The motivation is a documented research and product gap. Mainstream nutrition applications (MyFitnessPal, Cronometer, Noom) are built around Western food databases and recognition models trained on Food-101, a dataset with near-zero South Asian representation. Pakistani users receive missing results, incorrect calorie estimates, or complete recognition failure for everyday dishes such as *karahi*, *halwa puri*, *nihari* and *paya*. Scientific Reports (2025) confirms that no quality dataset for South Asian cuisine exists in the mainstream food-recognition literature; Tahir et al. (2020) is the only published Pakistani food dataset and contains only ~49 images per class, insufficient for reliable CNN fine-tuning. JMIR (2024) further reports that 70 % of users abandon health applications within 100 days, primarily because of manual food entry.

NutriSense AI fills this gap with a fine-tuned EfficientNetB0 trained on a curated multi-source dataset (Food-101, Khana 2025, DeshiFoodBD, and a self-scraped Pakistani gap-fill set) and ships the model end-to-end through a Flask inference API and a React + Vite web dashboard.

## 1.2 Headline Metrics

| Metric | Value |
|---|---|
| Classes recognised | **270** (Pakistani, South Asian, and Western dishes) |
| Top-1 accuracy on held-out validation | **82.65 %** |
| Top-3 accuracy on held-out validation | **93.65 %** |
| Model size (ONNX) | ~21 MB |
| Backend warm `/predict` inference time | ~1–1.6 seconds |
| Backend memory footprint on Render free tier | < 512 MB |
| Confidence threshold for auto-accept | 0.70 (else top-3 picker shown) |

## 1.3 System Architecture

```
                  +--------------------+
                  |  React + Vite      |
                  |  + Tailwind        |
                  |  web dashboard     |
                  +----------+---------+
                             |  multipart/form-data
                             v
         +----------------------------------+
         |   Flask API  (hosted on Render)  |
         |   -- predict.py    (ONNX runtime)|
         |   -- nutrition.py  (local JSON)  |
         |   -- insights.py   (OpenRouter)  |
         |   -- gradcam_api.py (static URLs)|
         +-----------------+----------------+
                           |
                           v
         +----------------------------------+
         |  Supabase                        |
         |  -- PostgreSQL (auth + scans)    |
         |  -- Storage (images + Grad-CAM)  |
         +----------------------------------+
```

The three runtime tiers run independently:
- **Web** is a pure client. It authenticates against Supabase directly (anon key + RLS), POSTs an image to the Flask API, and reads the user's own scan history from Supabase.
- **Flask API** is stateless and ONNX-only at inference time (no PyTorch in the deployed container), keeping the resident set under the 512 MB Render free-tier ceiling.
- **Supabase** provides PostgreSQL, Auth, and Storage in one service. Row-Level Security policies (`auth.uid() = user_id`) prevent any user from reading another user's scans.

## 1.4 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Model | **EfficientNetB0** (5.3 M params) | Best accuracy / size ratio for 224×224 inputs; small enough as ONNX for free-tier hosting |
| Training | PyTorch on Modal A10G GPU | Reproducible script-based pipeline, no session caps, ~$7 total spend |
| Inference | **ONNX Runtime (CPU)** | 20–40 % faster than PyTorch for single-image inference; tiny memory footprint |
| Backend | Flask 3 + gunicorn | Minimal overhead; four endpoints (`/health`, `/classes`, `/predict`, `/lookup`) |
| Database / Auth / Storage | **Supabase** (PostgreSQL + Auth + Storage) | All-in-one free tier with RLS, S3-compatible storage, and JWT-based auth |
| LLM insights | **OpenRouter** — `qwen/qwen-2.5-72b-instruct` | OpenAI-compatible API, free tier, picked after Gemini quota issues |
| Web | React 19 + Vite 5 + Tailwind 4 | Fast dev loop; standard tooling; Vite preset deploys cleanly on Vercel |
| Hosting | Render (backend) · Vercel (web) | All free tiers; covered in detail in [hosting.md](hosting.md) |

## 1.5 Feature List by Surface

### Web (React + Vite, hosted on Vercel)

- Landing page with hero illustration and call-to-action
- Email + password sign-up and sign-in via Supabase Auth (with email-verification UX and password reset)
- 3-step onboarding for new users: goal selection → dietary restrictions → intro
- Protected dashboard with drag-and-drop / click-to-select image upload
- Top-3 disambiguation picker when model confidence falls below 0.70, with user-correction logging (chosen label + original top-1 stored for retraining)
- Non-food state when confidence is very low (< 20 %), instead of misleading nutrition data
- ResultCard showing food name, confidence, nutrition grid (kcal / protein / carbs / fat), a 2–3 sentence insight, and an optional Grad-CAM thumbnail
- History table with sort toggle (by date or calories) and inline expand-on-row for insight text
- Insights page with weekly bar / line / pie charts (suppressed below 3 scans, with empty-state CTA)
- Chatbot page with suggested prompts and OpenRouter-powered replies
- Profile page with editable goal and dietary restrictions, plus an "About the Model" accordion

### Backend (Flask, hosted on Render)

- `GET /health` — service status, `model_loaded` flag, class count
- `GET /classes` — full class-index mapping (270 entries)
- `POST /predict` — multipart image + `user_goal`; returns `top_prediction`, `top_3`, `low_confidence`, `nutrition`, `insight`, `gradcam_sample_url`, `processing_time_ms`
- `GET /lookup` — fresh nutrition + insight for a chosen label (used when the user picks a top-3 alternative)
- ONNX Runtime inference on CPU with 224×224 ImageNet normalisation
- Local-JSON nutrition lookup with graceful fallback for missing entries
- OpenRouter (Qwen 2.5 72B) insight generation, goal-personalised, with hard-coded fallback string on API failure
- Mock mode (`MOCK_MODE=true`) for frontend development before the trained model is available
- CORS enabled for the web origin
- Integration test suite (`test_api.py`) runnable against any deployed instance

## 1.6 Academic Contribution

The primary academic contribution is the **fine-tuned EfficientNetB0 trained on a curated multi-source South Asian food dataset** — a documented and cited research gap. The dataset combines:

| Source | Classes | Role |
|---|---|---|
| Food-101 (kmader/food41) | 101 | Western baseline |
| Khana 2025 (kashyap077) | 236 | South Asian backbone |
| DeshiFoodBD (shaidurpranto) | 19 | Bangladeshi overlap |
| nutrisense-scraped (sameen03) | 13 | Pakistani gap-fill for dishes absent elsewhere |
| **Unified, after curation** | **270 classes** | **all classes ≥ 100 images, ~256 K total images** |

A formal **ablation study** compares EfficientNetB0 against MobileNetV2 and ResNet50 on the same 80 / 20 train / validation split with identical hyperparameters, justifying the architecture choice on accuracy, parameter count, and inference time. **Grad-CAM** heatmaps visualise the model's attention regions for representative South Asian dishes and are surfaced in-app via the "About the Model" page.

The web application serves as the deployment vehicle and viva-demonstration mechanism; it is not itself the academic contribution.

## 1.7 Screenshots

Selected screens captured from the production deployment (web at https://nutrisenseai.tech).

> Insert screenshots inline at the positions below before final submission. Recommended capture list:
>
> 1. **Landing page** (hero, value proposition, CTA)
> 2. **Sign-up / sign-in screen**
> 3. **Dashboard with upload zone**
> 4. **ResultCard after a successful scan** (nutrition grid + insight)
> 5. **Low-confidence top-3 picker**
> 6. **History table with sort toggle**
> 7. **Weekly insights charts**
> 8. **"About the Model" page showing the ablation table**

| Figure | Caption |
|---|---|
| Fig 1 | Landing page (https://nutrisenseai.tech) |
| Fig 2 | ResultCard after scanning a karahi photograph |
| Fig 3 | Low-confidence top-3 picker |
| Fig 4 | History table with date-sort active |
| Fig 5 | "About the Model" page showing ablation table |

---

*End of Section 1 — Application.*
