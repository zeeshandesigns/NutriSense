# NutriSense AI — Project Context

> **How to use this file:** Read once at the start of every AI session. Pair with `FRONTEND.md` or `BACKEND.md` for your specific work. For full requirements, see `SRS.md`. For training details, see `KAGGLE.md`.

---

## What We Are Building

Food recognition system for Pakistani and South Asian cuisine. User photographs a dish → app identifies it → shows nutrition + plain-language insight. No manual entry.

**Academic contribution:** Fine-tuned EfficientNetB0 CNN for South Asian cuisine (documented research gap — Scientific Reports 2025, Tahir et al. 2020).

---

## Team

| Team | Stack |
|---|---|
| Frontend (2) | React Native + Expo (mobile), React + Vite (web) |
| Backend/AI (2) | Flask, PyTorch/ONNX, EfficientNetB0, Supabase |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| ML model | EfficientNetB0 → ONNX | Best accuracy/size ratio; CPU-deployable; 5.3M params fits Render 512MB |
| Training | Kaggle GPU | Free T4/P100; datasets already available |
| Backend | Flask + Python | ONNX + Python native; 3 simple endpoints |
| Backend host | Render (free) | 512MB RAM; ONNX-only stays under limit |
| Database/Auth/Storage | Supabase | All-in-one free tier |
| Nutrition data | Local `nutrition_db.json` | No rate limits; accurate for desi food |
| AI insights | OpenRouter — `qwen/qwen-2.5-72b-instruct` | Free tier; OpenAI-compatible API |
| Mobile | React Native + Expo Router | iOS + Android; file-based routing |
| Web | React + Vite + Tailwind | Fast dev; standard tooling |
| Web host | Vercel (free) | GitHub-connected; auto-deploys |

---

## Supabase Project

| Key | Value |
|---|---|
| Project URL | `https://qjbeiaadjpgrmllzazxe.supabase.co` |
| Anon key | In `mobile/.env` and `web/.env` |
| Service key | In `backend/.env` only — never in client code |
| Storage buckets | `scan-images` (user photos), `gradcam` (heatmaps) — both public |

---

## API Contract (do not change without coordinating both teams)

### POST /predict
```
Request:  multipart/form-data { image: File, user_goal: string }
Response: {
  top_prediction: { label: string, confidence: float },
  top_3:          [{ label, confidence }],
  low_confidence: boolean,           // true when confidence < 0.70
  nutrition:      { calories, protein, carbs, fat },
  insight:        string,
  gradcam_sample_url?: string,       // optional, precomputed
  processing_time_ms: number
}
```

### GET /health → `{ status, model_loaded, classes }`
### GET /classes → `{ "0": "biryani", ... }`

**Confidence rule:** `< 0.70` → `low_confidence: true` → UI shows top-3 picker.

---

## Database Schema

```sql
profiles ( id, goal, restrictions[], onboarding_complete, created_at )
scans    ( id, user_id, food_label, confidence, top_3, nutrition,
           insight, image_url, created_at )
```

Both tables have RLS — users only see their own rows.  
Auto-trigger creates `profiles` row on sign-up.

---

## Environment Variables

```
backend/.env   MOCK_MODE, OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY,
               MODEL_PATH, CLASS_INDEX_PATH, NUTRITION_DB_PATH, GRADCAM_INDEX_PATH,
               CONFIDENCE_THRESHOLD

mobile/.env    EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
               EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_OPENROUTER_KEY

web/.env       VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
               VITE_API_BASE_URL, VITE_OPENROUTER_KEY
```

---

## Design Constraints

| Rule | Value |
|---|---|
| Confidence threshold | 0.70 (configurable via env var) |
| Image input size | 224×224 px, ImageNet normalisation |
| Max image upload size | 500KB (compressed client-side) |
| Backend RAM limit | 512MB — no PyTorch at runtime, ONNX only |
| Grad-CAM | Precomputed on Kaggle, served as static Supabase URLs |
| AI tone | Warm, non-judgmental — never use "unhealthy" or "bad" |

---

## What Is Explicitly Out of Scope

- Portion size estimation
- Mixed-dish / multi-item detection
- Calorie counting goals / tracking charts
- Meal planning
- Offline inference
- Urdu language UI
- Medical / clinical validation

---

## Document Index

| File | Purpose |
|---|---|
| `docs/CONTEXT.md` | This file — quick reference for AI sessions |
| `docs/FRONTEND.md` | AI build guide for the frontend team (7 phases) |
| `docs/BACKEND.md` | AI build guide for the backend/AI team (5 phases) |
| `docs/KAGGLE.md` | Dataset acquisition + training guide for Kaggle runner |
| `docs/SRS.md` | Full Software Requirements Specification |
| `SETUP.md` | Step-by-step local and production setup |
| `supabase/schema.sql` | Database schema — paste into Supabase SQL editor |
