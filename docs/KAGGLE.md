# NutriSense AI — Kaggle Training Guide

> **For the team member running training:** This document covers everything from dataset acquisition to downloading the final model. You do not need to understand the code — just follow the steps in order. All scripts are already written in `model/`.

---

## Overview

Training happens entirely on Kaggle's free GPU (no local GPU needed). The pipeline:

```
Download datasets → Scrape gap-fill classes → Merge + curate → Train → Ablate → Evaluate → Export ONNX
```

Total estimated time: **4–6 hours** (most of it waiting for Kaggle GPU).

---

## Step 1 — Create a Kaggle Account

1. Go to **kaggle.com** → Sign up (free)
2. Verify your phone number (required to use GPU)
3. Go to **Settings → API** → **Create New Token** → downloads `kaggle.json`

---

## Step 2 — Download the Datasets

Download all four datasets. You will upload them to Kaggle in Step 4.

### Dataset 1 — Food-101
- **URL:** https://www.kaggle.com/datasets/kmader/food41
- **Size:** ~5 GB
- **Classes:** 101 food categories (Western-focused)
- **Images per class:** 1,000
- **Download:** Click "Download" on Kaggle → you get `food41.zip`
- **Extract to:** a folder called `food-101/images/` (the images are nested by class name)

### Dataset 2 — Khana 2025 (Primary South Asian Source)
- **URL:** https://khana.omkar.xyz/ or arXiv:2509.06006
- **Size:** ~8 GB
- **Classes:** 80 Indian food categories
- **Images per class:** ~1,638
- **Why this:** It covers biryani, samosa, naan, halwa, korma, pakora and ~75 other dishes that overlap with Pakistani cuisine. This is the backbone of our South Asian coverage.
- **Download:** Follow instructions on khana.omkar.xyz to access the dataset

### Dataset 3 — DeshiFoodBD (Bangladeshi)
- **URL:** https://data.mendeley.com/datasets/tczzndbprx/1
- **Size:** ~200 MB
- **Classes:** 19 Bangladeshi dishes (many shared with Pakistani cuisine)
- **Images per class:** ~285
- **Dishes it covers:** Biryani variant, Nihari, Roti, Khichuri, Hilsha fish, Roshogolla
- **Download:** Click "Download All" on Mendeley Data

### Dataset 4 — Pakistani Food Dataset (Supplementary)
- **URL:** Search "Pakistani Food Dataset" on Kaggle (Tahir et al. 2020)
- **Size:** ~100 MB
- **Classes:** 100 Pakistani dishes
- **Images per class:** ~49 (too few to use as primary — supplementary only)
- **Why we include it:** Cherry-picks classes not covered by Khana or DeshiFoodBD

---

## Step 3 — Scrape Gap-Fill Classes (Run Locally)

These are Pakistani dishes absent from all existing datasets. Run this on your local machine before going to Kaggle.

### Install dependencies
```bash
cd model
pip install icrawler Pillow
```

### Run the scraper
```bash
python scrape.py --output_dir ./scraped --target 400
```

This scrapes ~20 Pakistani dishes from Google Images and Bing:

| Class | What it is |
|---|---|
| `halwa_puri` | Fried bread with semolina dessert — popular Pakistani breakfast |
| `paya` | Trotters/feet curry — slow-cooked, very common in Punjab |
| `gol_gappa` | Hollow crisp puffs filled with spiced water — street food |
| `nihari_lahori` | Slow-cooked beef/mutton shank — Lahori style |
| `channay` | Spiced chickpeas — breakfast and street food |
| `dahi_bhalla` | Lentil dumplings in yogurt — chaat item |
| `shami_kebab` | Ground meat and lentil patties — popular snack |
| `bun_kebab` | Pakistani-style burger with shami kebab |
| `anda_paratha` | Egg-stuffed flatbread — breakfast |
| `aloo_paratha` | Potato-stuffed flatbread |
| `karahi` | Stir-fried wok curry — chicken or mutton |
| `sajji` | Whole roasted lamb/chicken — Balochi cuisine |
| `chapli_kebab` | Flat minced-meat kebab — Peshawari style |
| `doodh_patti` | Milk tea boiled with tea leaves — street chai |
| `jalebi` | Deep-fried batter soaked in syrup — sweet |
| `gulab_jamun` | Milk-solid balls in sugar syrup — dessert |
| `rabri` | Thickened sweetened milk — dessert |
| `kheer` | Rice pudding — common South Asian dessert |
| `suji_halwa` | Semolina-based sweet |
| `haleem` | Slow-cooked meat and lentil porridge |

### After scraping
**Important:** Manually review the `scraped/` folder and delete:
- Images where the dish is not visible or unrecognisable
- Watermarked stock photos
- Images with text/menus overlaid
- Wrong dish (e.g. a "karahi" folder might contain unrelated images)

Target: at least **300 clean images per class** after cleanup. Delete the entire class folder if you cannot reach 300.

### Upload scraped images to Kaggle
1. Kaggle → **Datasets** → **New Dataset**
2. Name: `nutrisense-scraped`
3. Upload the entire `scraped/` folder
4. Visibility: Private → Create

---

## Step 4 — Upload All Datasets to Kaggle

Upload each dataset as a separate Kaggle dataset so the notebook can access them.

| Dataset | Kaggle Dataset Name to Use | Folder structure inside |
|---|---|---|
| Food-101 | Already on Kaggle — add `kmader/food41` | `food-101/images/{class_name}/` |
| Khana 2025 | `nutrisense-khana` | `images/{class_name}/` |
| DeshiFoodBD | `nutrisense-deshi` | `images/{class_name}/` |
| Pakistani dataset | Find on Kaggle or upload as `nutrisense-pakistani` | `{class_name}/` |
| Self-scraped | `nutrisense-scraped` (created in Step 3) | `{class_name}/` |

### Upload the model code
1. Zip the entire `model/` folder from this repo
2. Kaggle → **Datasets** → **New Dataset**
3. Name: **exactly** `nutrisense-code`
4. Upload the zip → Create

The training notebook imports scripts from this dataset.

---

## Step 5 — Create and Run the Training Notebook

### Create the notebook
1. Kaggle → **Code** → **New Notebook**
2. **File** → **Import Notebook** → upload `model/nutrisense_training.ipynb`

### Add datasets to the notebook
Click **+ Add Data** and add each dataset you uploaded:
- `kmader/food41` (Food-101)
- `nutrisense-khana`
- `nutrisense-deshi`
- `nutrisense-pakistani`
- `nutrisense-scraped`
- `nutrisense-code` (the model scripts)

### Enable GPU
- Settings (right panel) → **Accelerator** → **GPU T4 x2**
- This is free but requires phone verification

### Update paths in Cell 2
The notebook has paths that need to match your dataset names:
```python
CODE_DIR    = '/kaggle/input/nutrisense-code/model'
FOOD101_DIR = '/kaggle/input/food41/food-101/images'
KHANA_DIR   = '/kaggle/input/nutrisense-khana/images'
DESHI_DIR   = '/kaggle/input/nutrisense-deshi/images'
SCRAPED_DIR = '/kaggle/input/nutrisense-scraped'
PAK_DIR     = '/kaggle/input/nutrisense-pakistani'
```

Adjust the paths in Cell 2 if your dataset names differ.

### Run All Cells
**Run** → **Run All** → Walk away. Expected runtimes:

| Step | Time |
|---|---|
| Dataset curation | 10–20 min |
| Phase 1 training (5 epochs) | 30–45 min |
| Phase 2 fine-tuning (≤15 epochs) | 1.5–2.5 hours |
| Ablation study (3 models × 8 epochs) | 1.5–2 hours |
| Evaluation + Grad-CAM | 15–20 min |
| ONNX export | 2–3 min |

---

## Step 6 — What to Check During Training

Open the notebook output while it runs. Look for:

### After curation (Cell 3 — dataset stats)
- Classes: should be **80–110** (drop any class under 300 images)
- Minimum per class: should be ≥ **300**
- If a class has < 300: scrape more images for it or accept the drop

### During Phase 1 (Cell 4)
- `val_acc` should increase each epoch
- Typical range: 0.45 → 0.65 after 5 epochs
- If it stays below 0.30 after epoch 3: something is wrong with the data paths

### During Phase 2 (Cell 4 continued)
- `val_acc` should continue increasing
- Target: **≥ 0.75** by the end
- Early stopping will trigger automatically if it plateaus

### Ablation results (Cell 6)
- EfficientNetB0 should outperform MobileNetV2 and ResNet50 on top-1 accuracy
- If MobileNetV2 wins: that's fine academically — just update the ablation table in the app

---

## Step 7 — Download Outputs

After the notebook completes, go to the **Output** tab and download:

| File | Purpose | Where to put it |
|---|---|---|
| `model.onnx` | The trained model for Flask inference | `backend/data/model.onnx` |
| `model_class_index.json` | Maps index → food label | Rename to `class_index.json` → `data/class_index.json` |
| `dataset_stats.csv` | Per-class image counts — for the report | `docs/` or keep for reference |
| `evaluation/ablation_results.csv` | Ablation table — for the viva | `docs/evaluation/` |
| `evaluation/results.json` | Top-1 / top-3 accuracy per class | `docs/evaluation/` |
| `evaluation/confusion_matrix.png` | Confusion matrix heatmap — for the report | `docs/evaluation/` |
| `evaluation/per_class_accuracy.png` | Per-class bar chart — for the report | `docs/evaluation/` |
| `evaluation/gradcam_samples/` | Grad-CAM PNG folder — upload to Supabase | See Step 8 |

---

## Step 8 — Upload Grad-CAM Images to Supabase

The app shows precomputed Grad-CAM heatmaps (which part of the image the model focused on). These are static images served from Supabase Storage.

1. Open Supabase Dashboard → **Storage** → `gradcam` bucket
2. Upload all PNGs from `evaluation/gradcam_samples/`
3. For each file: click it → **Get URL** → copy the public URL
4. Edit `data/gradcam_index.json` in the repo:
```json
{
  "biryani":        "https://qjbeiaadjpgrmllzazxe.supabase.co/storage/v1/object/public/gradcam/biryani_gradcam.png",
  "chicken_karahi": "https://qjbeiaadjpgrmllzazxe.supabase.co/storage/v1/object/public/gradcam/chicken_karahi_gradcam.png"
}
```

---

## Step 9 — Activate the Real Model

Once `model.onnx` is in `backend/data/`:

1. Edit `backend/.env`:
   ```
   MOCK_MODE=false
   MODEL_PATH=./data/model.onnx
   CLASS_INDEX_PATH=./data/class_index.json
   ```

2. Restart the backend:
   ```bash
   cd backend
   venv\Scripts\activate
   python app.py
   ```

3. Test it:
   ```bash
   python test_api.py
   ```
   `model_loaded` should now be `true`.

4. Manual test: take a photo of biryani or karahi → POST to `/predict` → check the label.

---

## Expected Final Metrics

Based on similar work (IJIIS 2024, DesiVisionNet):

| Metric | Expected | Acceptable minimum |
|---|---|---|
| Top-1 accuracy (overall) | 78–85% | 70% |
| Top-3 accuracy (overall) | 90–95% | 85% |
| Top-1 (South Asian dishes) | 72–80% | 65% |
| EfficientNetB0 vs MobileNetV2 | +4–8% top-1 | Any positive margin |

If accuracy is below the minimum: check that the data paths are correct and the images are clean. The most common cause of low accuracy is noisy scraped images.

---

## Class Index — Final 100 Classes

These are the 100 classes in `data/class_index.json` after curation. Classes marked **[SA]** are South Asian dishes.

| Index | Label | [SA] |
|---|---|---|
| 0 | aloo_paratha | ✅ |
| 1 | anda_paratha | ✅ |
| 2 | apple_pie | |
| 3 | baklava | |
| 4 | biryani | ✅ |
| 5 | bread_pudding | |
| 6 | bun_kebab | ✅ |
| 7 | caesar_salad | |
| 8 | cannoli | |
| 9 | channay | ✅ |
| 10 | chapli_kebab | ✅ |
| 11 | cheesecake | |
| 12 | chicken_karahi | ✅ |
| 13 | chicken_wings | |
| 14 | chocolate_cake | |
| 15 | churros | |
| 16 | clam_chowder | |
| 17 | club_sandwich | |
| 18 | creme_brulee | |
| 19 | daal | ✅ |
| 20 | dahi_bhalla | ✅ |
| 21 | donuts | |
| 22 | doodh_patti | ✅ |
| 23 | edamame | |
| 24 | eggs_benedict | |
| 25 | falafel | |
| 26 | filet_mignon | |
| 27 | fish_and_chips | |
| 28 | french_fries | |
| 29 | french_toast | |
| 30 | garlic_bread | |
| 31 | gnocchi | |
| 32 | gol_gappa | ✅ |
| 33 | greek_salad | |
| 34 | grilled_salmon | |
| 35 | gulab_jamun | ✅ |
| 36 | gyoza | |
| 37 | haleem | ✅ |
| 38 | halwa_puri | ✅ |
| 39 | hamburger | |
| 40 | hot_dog | |
| 41 | hummus | |
| 42 | ice_cream | |
| 43 | jalebi | ✅ |
| 44 | karahi | ✅ |
| 45 | kheer | ✅ |
| 46 | lasagna | |
| 47 | macaroni_and_cheese | |
| 48 | miso_soup | |
| 49 | naan_bread | ✅ |
| 50 | nachos | |
| 51 | nihari_lahori | ✅ |
| 52 | omelette | |
| 53 | onion_rings | |
| 54 | oysters | |
| 55 | pad_thai | |
| 56 | paella | |
| 57 | pancakes | |
| 58 | panna_cotta | |
| 59 | paya | ✅ |
| 60 | pho | |
| 61 | pizza | |
| 62 | pork_chop | |
| 63 | poutine | |
| 64 | rabri | ✅ |
| 65 | ramen | |
| 66 | ravioli | |
| 67 | risotto | |
| 68 | sajji | ✅ |
| 69 | samosa | ✅ |
| 70 | sashimi | |
| 71 | shami_kebab | ✅ |
| 72 | shrimp_and_grits | |
| 73 | spaghetti_bolognese | |
| 74 | spaghetti_carbonara | |
| 75 | spring_rolls | |
| 76 | steak | |
| 77 | strawberry_shortcake | |
| 78 | sushi | |
| 79 | suji_halwa | ✅ |
| 80 | tacos | |
| 81 | takoyaki | |
| 82 | tiramisu | |
| 83 | waffles | |
| 84 | dumplings | |
| 85 | caprese_salad | |
| 86 | beet_salad | |
| 87 | bruschetta | |
| 88 | ceviche | |
| 89 | deviled_eggs | |
| 90 | foie_gras | |
| 91 | french_onion_soup | |
| 92 | hot_and_sour_soup | |
| 93 | huevos_rancheros | |
| 94 | lobster_bisque | |
| 95 | macarons | |
| 96 | mussels | |
| 97 | prime_rib | |
| 98 | red_velvet_cake | |
| 99 | tuna_tartare | |

**Total: 100 classes, ~35 South Asian dishes**

The final class index after Kaggle curation may differ slightly — classes with fewer than 300 images get dropped, and the numbering is re-assigned alphabetically. Always use the `class_index.json` from Kaggle output, not this table, as the authoritative index.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `ModuleNotFoundError` in notebook | nutrisense-code dataset path wrong | Check Cell 2 CODE_DIR path |
| Curation produces 0 classes | Dataset folder structure doesn't match expected | Check images are in `{dataset}/images/{class}/` |
| val_acc stuck below 0.30 | Corrupted or wrong images | Check a few images manually in the unified_dataset |
| GPU quota exceeded | Used 30h this week | Wait until Monday (weekly reset) or use CPU (very slow) |
| ONNX export fails | PyTorch version mismatch | Ensure opset_version=17 in export.py |
| `model_class_index.json` not found | Rename it to `class_index.json` | `cp model_class_index.json class_index.json` |
