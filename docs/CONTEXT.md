# NutriSense AI — Project Context

> **How to use this file:** Read it once at the start of every AI session to re-establish context. Always pair it with your team-specific file (`FRONTEND.md` or `BACKEND.md`). Do not give this file to an AI alone.

---

## 1. What We Are Building

NutriSense AI is a **Pakistani and South Asian food recognition system**. The user points their phone camera at any desi meal, the app identifies it, and instantly explains what they are eating in plain language — without any manual entry.

The central academic contribution is a **fine-tuned EfficientNetB0 CNN** trained specifically on South Asian cuisine — a documented gap in current food recognition research (confirmed by Scientific Reports 2025 and Tahir et al. 2020). This model is deployed as a cross-platform mobile app and a web dashboard.

**This is a Final Year Project (FYP).** Every decision balances academic defensibility with practical demo-ability.

---

## 2. The Problem

Every major food recognition and nutrition app — MyFitnessPal, Cronometer, Noom — is built around Western food databases. Pakistani users searching for karahi, nihari, or halwa puri get missing results, wrong calorie values, or no recognition at all. Existing image recognition models are trained on Food-101, a dataset with almost no South Asian dishes.

---

## 3. Three User Personas

| | Ahmed, 24 | Sana, 27 | Bilal, 21 |
|---|---|---|---|
| **Goal** | Muscle gain | Health awareness | Just curious |
| **Pain** | Apps give wrong macros for desi food | Too busy for manual logging | Overwhelmed, wants plain answers |
| **Want** | Photo → correct protein and macros | Point phone, know what I ate | Point phone, is this food okay? |

---

## 4. Three Things the App Does

| Action | Feature | How |
|---|---|---|
| **Identifies** | Food recognition | EfficientNetB0 CNN classifies the photographed dish |
| **Explains** | Nutritional insight | Gemini API generates plain-language context personalised to user goal |
| **Remembers** | History + patterns | Supabase stores every scan; weekly patterns shown over time |

**Explicitly removed from scope:** calorie counting/goal tracking, meal planning, portion size estimation, manual food logging, lab report integration.

---

## 5. Team Structure

| Team | Members | Responsibility |
|---|---|---|
| Frontend | 2 devs | React Native + Expo mobile app; React + Vite web dashboard |
| Backend/AI | 2 devs | Flask REST API; EfficientNetB0 training pipeline; Supabase schema; Render deployment |

Each team has its own AI prompt document (`FRONTEND.md` or `BACKEND.md`). This file is the shared foundation both teams reference.

---

## 6. System Architecture

```
User's phone
    │
    ▼ (compressed JPEG < 500KB)
POST /predict  ←──── Flask backend (Render, Python)
    │
    ├── EfficientNetB0 (ONNX, CPU inference)  → top-3 predictions + confidence
    ├── nutrition_db.json (local lookup)       → calories, protein, carbs, fat
    ├── Gemini gemini-1.5-flash (free tier)   → 2-3 sentence plain-language insight
    └── Returns JSON response
         │
         ▼
Mobile app / Web dashboard
    │
    ├── Renders ResultCard (label, confidence bar, nutrition grid, insight)
    ├── Uploads image to Supabase Storage (scan-images bucket)
    └── Saves scan row to Supabase PostgreSQL
```

---

## 7. Tech Stack

| Layer | Technology | Why This, Not Something Else |
|---|---|---|
| ML model | EfficientNetB0 (PyTorch → ONNX) | Best accuracy/parameter ratio at 5.3M params; 97.54% on Food-101 with fine-tuning (IJIIS 2024); CPU-deployable within Render's 512MB free RAM; lighter than EfficientNetB7 (66M params) |
| ML training | Kaggle Notebooks | Free GPU (P100/T4), 30h/week; Pakistani dataset already on Kaggle; notebooks persist between sessions |
| Backend | Flask + Python | Model inference runs in Python natively; simple REST endpoints; ONNX runtime is Python-native; minimal overhead for FYP scale |
| Backend host | Render (free tier) | Free Python web service; persistent disk for model files; 512MB RAM fits ONNX-only stack |
| Nutrition data | Local `nutrition_db.json` | No API rate limits or keys; values tailored to Pakistani dishes (Nutritionix gets desi food wrong); offline and instant |
| AI insights | Gemini gemini-1.5-flash | Free tier: 15 RPM, 1M tokens/day — sufficient for FYP demo scale; no paid tier needed |
| Database + Auth | Supabase | PostgreSQL + Auth + Storage in one free-tier service; RLS handles user data isolation; real-time subscriptions available if needed |
| Mobile | React Native + Expo Router | Single codebase for iOS and Android; Expo Router provides file-based routing (same mental model as Next.js); built-in camera and image picker via Expo modules |
| Web | React + Vite + Tailwind CSS | Fast dev build; Tailwind avoids a CSS framework dependency; standard tooling the team already knows |
| Mobile UI | react-native-paper | Material Design components; consistent with Android conventions; good accessibility defaults |
| Web host | Vercel (free tier) | GitHub-connected; automatic deploys on push; zero config for Vite projects |

---

## 8. Dataset Strategy

| Dataset | Classes | Per Class | Role |
|---|---|---|---|
| Food-101 | 101 | 1,000 | Global food baseline |
| **Khana (2025)** | 80 | ~1,638 | Primary South Asian backbone — 131K images, many overlapping with Pakistani cuisine (biryani, samosa, halwa, naan, roti, korma, dal, pakora) |
| DeshiFoodBD | 19 | ~285 | Bangladeshi overlap (nihari, biryani variant) |
| Self-scraped | 15–20 | 300–500 | Pakistani-only gap fill: halwa puri, paya, gol gappa, chapli kebab, sajji, bun kebab, doodh patti |
| Pakistani dataset (Tahir 2020) | 100 | ~49 | **Supplementary only** — cherry-pick classes not covered by Khana/DeshiFoodBD |

**Final curated dataset:** ~100 classes, all with ≥300 images, ~35 South Asian dishes.

Academic framing: *"We identified 15–20 dishes absent from all existing public datasets and collected original training data for each class."*

---

## 9. Database Schema

Run this SQL in the Supabase SQL Editor before any development begins.

```sql
-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text NOT NULL DEFAULT 'curious'
    CHECK (goal IN ('weight_loss', 'muscle_gain', 'curious')),
  restrictions text[] NOT NULL DEFAULT '{}',
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_label text NOT NULL,
  confidence float NOT NULL,
  top_3 jsonb,
  nutrition jsonb NOT NULL,
  insight text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scans_user_created
  ON scans (user_id, created_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_scans" ON scans FOR ALL USING (auth.uid() = user_id);
```

**Storage:** Create a bucket named `scan-images` with public read access in Supabase Dashboard → Storage.

---

## 10. API Contract

### POST /predict

**Request:** `multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `image` | File | JPEG or PNG; compress to <500KB before sending |
| `user_goal` | string | `'weight_loss'` \| `'muscle_gain'` \| `'curious'` |

**Response 200:**
```json
{
  "top_prediction": { "label": "chicken_karahi", "confidence": 0.91 },
  "top_3": [
    { "label": "chicken_karahi", "confidence": 0.91 },
    { "label": "chicken_handi",  "confidence": 0.06 },
    { "label": "butter_chicken", "confidence": 0.03 }
  ],
  "low_confidence": false,
  "nutrition": { "calories": 320, "protein": 28, "carbs": 8, "fat": 19 },
  "insight": "Karahi is a high-protein dish — well suited to your muscle-gain goal...",
  "gradcam_sample_url": "https://xyz.supabase.co/storage/v1/object/public/gradcam/chicken_karahi.png",
  "processing_time_ms": 1240
}
```

Notes:
- `low_confidence: true` when `top_prediction.confidence < 0.70` — UI must show top-3 picker
- `gradcam_sample_url` is optional (absent if no precomputed image exists for that class)
- `nutrition` values are per standard serving; `calories` in kcal, macros in grams
- Food labels use underscores: `"chicken_karahi"`, `"halwa_puri"`, `"nihari_lahori"`

**Response 400:**
```json
{ "error": "No image file in request" }
```

### GET /health
```json
{ "status": "ok", "model_loaded": true, "classes": 100 }
```

### GET /classes
```json
{ "0": "biryani", "1": "chicken_karahi", "2": "halwa_puri", "..." : "..." }
```

---

## 11. UI Behaviour Rules

| Situation | Behaviour |
|---|---|
| `confidence >= 0.70` | Auto-accept → show full ResultCard |
| `confidence < 0.70` | Show top-3 picker (confirm screen) → user selects → show ResultCard |
| `nutrition.calories` is not a number | Show "Nutrition data not available for this dish" instead of the grid |
| Insights page, < 3 scans this week | Show "Scan 3+ meals to see weekly patterns" — suppress charts |
| Insights page, 0 scans | Show full empty state with a "Scan Now" CTA button |
| History page, 0 scans | Show "No scans yet — try scanning your next meal!" |
| API call fails | Show error state with retry button; do not crash |

---

## 12. Design System

| Token | Value |
|---|---|
| Primary green | `#2E7D32` |
| Light green bg | `#f0fdf4` |
| Light green accent | `#dcfce7` |
| Text primary | `#111827` |
| Text secondary | `#6b7280` |
| Error | `#EF4444` |
| Warning | `#F59E0B` |
| Font | `system-ui, -apple-system, sans-serif` |
| Mobile UI library | `react-native-paper` (Material Design 3) |
| Web UI | Tailwind CSS utility classes |
| Tone | Warm, non-judgmental; **never** describe food as unhealthy |

---

## 13. Environment Variables

**Backend** (`backend/.env`)
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

**Mobile** (`mobile/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=https://nutrisense-api.onrender.com
EXPO_PUBLIC_GEMINI_KEY=
```

**Web** (`web/.env`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=https://nutrisense-api.onrender.com
VITE_GEMINI_KEY=
```

---

## 14. Academic Deliverables (Viva)

| Deliverable | How It's Produced |
|---|---|
| Ablation table (EfficientNetB0 vs MobileNetV2 vs ResNet50) | `ablation.py` → `ablation_results.csv` |
| Confusion matrix | `evaluate.py` → PNG |
| Per-class accuracy (top 5 best / worst) | `evaluate.py` → `results.json` |
| Grad-CAM heatmap samples | `gradcam.py` → PNGs → uploaded to Supabase Storage |
| Dataset curation report | `curate_classes.py` → `dataset_stats.csv` |
| Live demo | Expo Go APK on physical device + web dashboard on Vercel |

**Stated limitations (acknowledge proactively in viva):**
- Portion size estimation not attempted — research-grade problem
- Mixed-dish scenes classify dominant food only
- Pakistani dish accuracy lower than Food-101 due to smaller per-class data
- Not clinically validated; not for medical use
- Nutritional values are approximate standard-serving figures
