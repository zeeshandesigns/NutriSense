# NutriSense AI — Setup Checklist

Everything you need to do manually, in order. The code is already written — you are connecting the services and filling in keys.

**Legend:** `[KEY]` = copy a value and save it | `[RUN]` = run a command | `[PASTE]` = paste into a web UI | `[FILE]` = create or edit a file

---

## Stage 0 — Accounts to create (do this first, all free)

| Service | URL | What it's for |
|---|---|---|
| Supabase | supabase.com | Database, Auth, Storage |
| OpenRouter | openrouter.ai | Qwen LLM API key (free tier) |
| Render | render.com | Backend hosting |
| Vercel | vercel.com | Web hosting |
| Modal | modal.com | GPU training (offline, optional) |

---

## Stage 1 — Get all API keys before touching any code

### 1.1 OpenRouter API Key
1. Go to **openrouter.ai** → Sign in (Google or GitHub auth)
2. Click your avatar → **Keys** → **Create Key**
3. `[KEY]` Copy it (starts with `sk-or-v1-...`) → call it `OPENROUTER_API_KEY`
4. The Qwen model (`qwen/qwen-2.5-72b-instruct`) is free-tier — sufficient for the FYP demo and viva

### 1.2 Supabase Keys
1. Go to **supabase.com** → New project (pick a region close to you)
2. Wait ~2 minutes for it to provision
3. Go to **Settings → API**
4. `[KEY]` Copy **Project URL** → `SUPABASE_URL`
5. `[KEY]` Copy **anon / public** key → `SUPABASE_ANON_KEY`
6. `[KEY]` Copy **service_role** key → `SUPABASE_SERVICE_KEY`
   - ⚠️ Keep service_role secret — it is used by the backend only, never in the web app

---

## Stage 2 — Supabase Setup

### 2.1 Run the database schema
1. In your Supabase project → **SQL Editor** → **New query**
2. `[PASTE]` the entire contents of [`supabase/schema.sql`](../supabase/schema.sql) and click **Run** — it creates the `profiles` and `scans` tables, the auto-profile trigger, and the Row-Level Security policies.

### 2.2 Create Storage buckets
1. **Storage** → **New bucket** → Name: `scan-images` | Public: ✅ ON | Create
2. **New bucket** again → Name: `gradcam` | Public: ✅ ON | Create

### 2.3 Enable Email Auth
1. **Authentication → Providers → Email** — make sure it's enabled (it is by default)
2. Optional: disable "Confirm email" for faster testing during development

---

## Stage 3 — Environment Files

Create these by copying the `.example` files. Never commit `.env` files to git.

### 3.1 Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
MOCK_MODE=true
OPENROUTER_API_KEY=paste_your_openrouter_key_here
SUPABASE_URL=paste_your_supabase_url_here
SUPABASE_SERVICE_KEY=paste_your_service_role_key_here
MODEL_PATH=../model.onnx
CLASS_INDEX_PATH=../data/class_index.json
NUTRITION_DB_PATH=../data/nutrition_db.json
GRADCAM_INDEX_PATH=../data/gradcam_index.json
CONFIDENCE_THRESHOLD=0.70
```

> Keep `MOCK_MODE=true` until you have the trained `model.onnx`.

### 3.2 Web

```bash
cd web
cp .env.example .env
```

Edit `web/.env`:
```
VITE_SUPABASE_URL=paste_your_supabase_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
VITE_API_BASE_URL=http://localhost:5000
VITE_OPENROUTER_KEY=paste_your_openrouter_key_here
```

---

## Stage 4 — Run Locally (development, no trained model needed)

### 4.1 Start the backend
```bash
cd backend
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
python app.py
```

Expected output:
```
[MOCK] Model not loaded — mock predictions enabled (270 classes)
Nutrition DB loaded: 120 entries
Grad-CAM index loaded: 0 entries
Running on http://0.0.0.0:5000
```

Test it:
```bash
python test_api.py
```
All integration tests should pass.

### 4.2 Start the web dashboard
```bash
cd web
npm run dev
```
Open `http://localhost:5173` — the landing page should appear. Sign up → you'll see the scan dashboard.

---

## Stage 5 — Model Training (Modal, optional — to replace mock with the real model)

Training runs offline on a Modal A10G GPU; it is **not** part of the runtime. A single script declares the whole flow.

```bash
pip install modal
modal token new                                   # one-time auth
modal run --detach model/modal_train.py::train_pipeline
```

The `--detach` flag lets the run survive a local disconnect. On completion, download the artifacts (`model.onnx`, `class_index.json`, evaluation outputs, Grad-CAM PNGs) with `modal volume get`, then:

1. Copy `model.onnx` to the repo root (or `backend/data/`) and `class_index.json` to `data/`.
2. Set `MOCK_MODE=false` in `backend/.env`.
3. Restart the backend and run `python test_api.py` — `model_loaded` should now be `true`.

### Grad-CAM upload
Upload the generated PNGs to the Supabase `gradcam` bucket, copy each public URL, and add entries to `data/gradcam_index.json`:
```json
{
  "biryani": "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/gradcam/biryani_gradcam.png",
  "chicken_karahi": "https://..."
}
```

---

## Stage 6 — Production Deployment

### 6.1 Deploy Backend to Render
1. **render.com** → New → **Web Service** → connect your GitHub repo (`zeeshandesigns/NutriSense`)
2. Settings (auto-detected from `render.yaml`):
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
3. **Environment Variables** → add `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `MOCK_MODE=false`
4. Deploy → wait ~3–5 minutes for the first deploy
5. The model files ship in the repo (`model.onnx` ~21 MB), so no persistent disk is needed
6. Test: `curl https://YOUR_RENDER_URL.onrender.com/health` → `{"status":"ok","model_loaded":true,"classes":270}`

### 6.2 Deploy Web to Vercel
1. **vercel.com** → **Add New Project** → import `zeeshandesigns/NutriSense`
2. Settings:
   - **Root Directory:** `web`
   - **Framework:** Vite (locked in `web/vercel.json`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables** → add all from `web/.env`, but set `VITE_API_BASE_URL=https://YOUR_RENDER_URL.onrender.com`
4. Deploy → ~1 minute. Optionally attach a custom domain (e.g. `nutrisenseai.tech`).

---

## Stage 7 — Pre-Viva Checklist

Run through this the day before the viva.

| # | Check | How to verify |
|---|---|---|
| 1 | Backend health | `curl https://YOUR_RENDER_URL.onrender.com/health` → `model_loaded: true`, `classes: 270` |
| 2 | Warm the dyno | Hit `/health` ~2 minutes before the demo (free tier cold-starts in ~30–45 s) |
| 3 | Karahi prediction | Upload a karahi photo on web → correct label, confidence ≥ 0.70 |
| 4 | Low confidence | Upload an ambiguous photo → `low_confidence: true`, 3 options shown |
| 5 | Web scan | Upload a food photo → result card renders with nutrition + insight |
| 6 | Web history | History table shows all scans, grouped by day |
| 7 | Chatbot | "Is karahi good for muscle gain?" → relevant 2–4 sentence response |
| 8 | About the Model | Profile → About the Model → ablation table and limitations shown |

---

## Quick Reference — URLs & keys

| Item | Value |
|---|---|
| Supabase Project URL | |
| Supabase Anon Key | |
| OpenRouter API Key | |
| Render Backend URL | |
| Vercel Web URL | |

---

## Common Errors

| Error | Fix |
|---|---|
| `OPENROUTER_API_KEY is required` | Add `OPENROUTER_API_KEY` to `backend/.env` or set `MOCK_MODE=true` |
| `model.onnx not found` | Either set `MOCK_MODE=true` or copy `model.onnx` to the repo root |
| Supabase insert fails | Check RLS policies were created — rerun `supabase/schema.sql` |
| Render deploy fails | Check Build Command and Root Directory are set correctly |
| Vercel build wrong framework | Ensure Root Directory = `web` and framework preset = Vite |
| Tailwind classes not applying | Make sure `@import "tailwindcss"` is the first line of `web/src/index.css` |
