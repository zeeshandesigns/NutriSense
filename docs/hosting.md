# 2. Hosting

NutriSense AI runs on a polyglot, multi-region free-tier stack. Each
layer is hosted on the provider best suited to its workload, and every
production URL is publicly accessible at submission time.

## 2.1 Live URLs

| Layer | Provider | Live URL | Auto-deploy trigger |
|---|---|---|---|
| **Web dashboard** (primary) | Vercel + GET.tech | <https://nutrisenseai.tech> | Push to `main` |
| Web dashboard (vercel.app alias) | Vercel | <https://nutrisense-zynk-it.vercel.app> | Push to `main` |
| **Backend API** | Render | <https://nutrisense-msq1.onrender.com> | Push to `main` |
| Backend health endpoint | Render | <https://nutrisense-msq1.onrender.com/health> | — |
| **Database / Auth / Storage** | Supabase | qjbeiaadjpgrmllzazxe.supabase.co | n/a |
| **Static CDN** (Grad-CAM PNGs) | Supabase Storage | …/storage/v1/object/public/gradcam/ | Manual upload script |
| **ML training infra** | Modal | <https://modal.com/apps/zynk-system/main> | Manual `modal run` |
| **Source code** | GitHub | <https://github.com/zeeshandesigns/NutriSense> | Public, viewer access |

All URLs were verified live within 24 hours of submission. `/health` returns
`{"status":"ok","model_loaded":true,"classes":270}` as the canary check.

## 2.2 Provider choice rationale

### Backend → **Render** (Free tier, 512 MB RAM)

The Flask backend runs ONNX Runtime — not PyTorch — which lets the
entire image (Python + onnxruntime + Pillow + numpy + Flask + gunicorn)
fit in Render's 512 MB free-tier RAM with peak usage around 180 MB.
PyTorch alone would exceed the limit, so the architecture was chosen to
match the host's constraints.

**Deployment pipeline.** A `render.yaml` blueprint in the repo root
declares the service: root directory `backend/`, build command
`pip install -r requirements.txt`, start command `gunicorn app:app`,
plus all environment variables (with secret values marked
`sync: false` and pasted manually in the dashboard once). Pushing to
`main` triggers an auto-deploy that completes in ~3–4 minutes.

**Free-tier caveat.** Render free instances sleep after 15 minutes of
inactivity and take ~30–45 seconds to cold-start. The model file
(~21 MB: `model.onnx` + `model.onnx.data`) is committed to the
repo so it ships with the deploy — no persistent disk needed.

### Web → **Vercel** (Hobby tier)

The web dashboard is a Vite + React 19 single-page app, which Vercel
serves from its global edge network. Settings:

- **Root directory:** `web/`
- **Framework preset:** Vite (locked in `web/vercel.json` so auto-detection cannot drift)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables (Production / Preview / Development):**
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`,
  `VITE_OPENROUTER_KEY`

A custom domain `nutrisenseai.tech` (purchased via GET.tech /
Namify) is attached and serves a Let's Encrypt HTTPS certificate
automatically issued by Vercel.

### Database / Auth / Storage → **Supabase** (Free tier)

A single Supabase project hosts three services:

- **PostgreSQL** with two tables (`profiles`, `scans`) and Row-Level
  Security policies that prevent any user from reading another user's
  rows.
- **Supabase Auth** (email + password) — handles sign-up, email
  verification, password reset.
- **Supabase Storage** with two public buckets:
  - `scan-images` — user-uploaded meal photos
  - `gradcam` — precomputed Grad-CAM heatmap PNGs for the 25 most
    relevant South-Asian dish classes

A database trigger auto-creates a `profiles` row on every `auth.users`
INSERT, so onboarding can immediately read+write to it.

### ML training → **Modal** (paid, ~$7 per full training run)

Modal is used only for the offline training pipeline — not at runtime.
A single Python script (`model/modal_train.py`) declares the entire
flow as Modal functions (`setup_datasets`, `train_pipeline`, plus
helpers). Training runs on Modal's A10G GPU; outputs (model.onnx,
class index, evaluation artifacts, Grad-CAM PNGs) are downloaded to
the developer's machine via `modal volume get`, then committed to
the repo for the next backend deploy.

Modal was chosen over Kaggle (the original plan) after Kaggle's free
notebook environment killed several consecutive sessions due to its
9-hour interactive limit. Modal has no such cap and explicit pricing.

## 2.3 Cost summary

| Service | Plan | Monthly cost |
|---|---|---|
| Render | Free | $0 |
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| OpenRouter API (Qwen) | Free tier | $0 (free model route) |
| Modal | Pay-per-use | one-time ~$7 for training |
| GET.tech domain | — | $5.99/year (one-time) |
| **Total recurring** | | **$0/month** |

The entire system runs at $0/month after the one-time training spend
and the domain. All providers' free tiers are well within the limits
expected of an FYP demo.

## 2.4 Deployment workflows

```
Code change                Affects
──────────────────         ────────────────────────────
backend/*.py        ───►   git push main  ───►  Render auto-build  (~4 min)
web/src/**          ───►   git push main  ───►  Vercel auto-build  (~1 min)
model/*.py          ───►   modal run --detach model/modal_train.py::train_pipeline  (~6 hrs)
supabase/*.sql      ───►   Run in Supabase SQL Editor (one-click deep link)
data/*.json         ───►   git push main  ───►  Render auto-build  (model files redeploy)
```

The `main` branch is the canonical source of truth for the web and
backend production surfaces.
