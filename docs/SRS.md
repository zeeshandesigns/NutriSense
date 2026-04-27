# Software Requirements Specification
# NutriSense AI — Pakistani Food Recognition System

**Version:** 1.0  
**Date:** April 2026  
**Project Type:** Final Year Project (FYP)  
**Institution:** [Your University]  
**Team:** 4 members (2 Frontend, 2 Backend/AI)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [User Requirements](#3-user-requirements)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture](#6-system-architecture)
7. [Interface Specifications](#7-interface-specifications)
8. [Data Requirements](#8-data-requirements)
9. [Design Decisions and Rationale](#9-design-decisions-and-rationale)
10. [Constraints and Limitations](#10-constraints-and-limitations)
11. [Acceptance Criteria](#11-acceptance-criteria)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for NutriSense AI, a deep learning–based food recognition system trained specifically on Pakistani and South Asian cuisine. It serves as the authoritative reference for design, implementation, testing, and academic evaluation decisions.

### 1.2 Scope

NutriSense AI is a cross-platform system consisting of:
- A fine-tuned EfficientNetB0 CNN trained on a curated multi-source South Asian food dataset
- A Flask REST API serving real-time food recognition predictions
- A React Native mobile application (iOS and Android)
- A React web dashboard

The system recognises food from a single photograph and delivers nutritional context and plain-language insights without requiring any manual data entry.

### 1.3 Problem Statement

Every major food recognition application — MyFitnessPal, Cronometer, Noom — is built around Western food databases and recognition models trained on Food-101, a dataset with near-zero South Asian representation. Pakistani users receive missing results, incorrect calorie values, or complete recognition failure for everyday desi dishes. No publicly available, production-grade food recognition model exists for South Asian cuisine.

This is confirmed by:
- Scientific Reports (2025): no quality dataset for South Asian or Central Asian cuisine exists in the mainstream food recognition literature
- Tahir et al. (2020): the first Pakistani food dataset covers 100 classes with only ~49 images per class — insufficient for reliable fine-tuning
- JMIR (2024): 70% of users abandon health apps within 100 days; manual entry is the primary driver of abandonment

### 1.4 Academic Contribution

The primary academic contribution is the fine-tuned EfficientNetB0 model trained on South Asian cuisine — a documented and cited research gap. The mobile and web applications serve as the deployment vehicle and viva demonstration mechanism, not the contribution itself.

---

## 2. Overall Description

### 2.1 Product Perspective

NutriSense AI fills a gap in the existing food recognition ecosystem by extending coverage to South Asian cuisine through transfer learning on a curated multi-source dataset. It is not a general nutrition tracking application — it is a food identification and contextualisation system.

### 2.2 What the System Does

| Action | Feature | Mechanism |
|---|---|---|
| **Identifies** | Food recognition | EfficientNetB0 CNN, 100-class classifier |
| **Explains** | Nutritional insight | OpenRouter/Qwen generates plain-language context |
| **Remembers** | Scan history | Supabase PostgreSQL stores every scan |

### 2.3 What the System Does NOT Do

The following features were explicitly considered and removed:

| Removed Feature | Reason for Removal |
|---|---|
| Calorie counting / goal tracking | Research shows this is the primary cause of app abandonment (JMIR 2024) |
| Meal planning and diet plans | Not related to the CNN contribution; adds scope without academic value |
| Manual food text entry | Contradicts the core snap-to-understand promise |
| Portion size estimation | Research-grade problem; companies like Google and Snap have worked on this for years |
| Lab report integration | Legal complexity, out of FYP scope |
| Barcode scanning | Existing solutions are mature; no research gap |

### 2.4 User Classes

| Persona | Age | Goal | Key Pain |
|---|---|---|---|
| Ahmed | 24, CS graduate | Muscle gain | Apps give wrong macros for desi food |
| Sana | 27, medical student | Health awareness | Too busy for manual logging |
| Bilal | 21, university student | Curiosity | Overwhelmed, wants plain answers |

All three share the same core problem: they eat Pakistani food daily and no existing tool helps them understand it.

### 2.5 Operating Environment

| Component | Environment |
|---|---|
| ML training | Kaggle GPU (T4 x2, free tier) |
| Backend API | Render free tier (Python, 512MB RAM) |
| Web dashboard | Vercel free tier |
| Mobile app | Expo Go (development), EAS APK (demo) |
| Database | Supabase free tier (PostgreSQL + Storage) |

---

## 3. User Requirements

### 3.1 Primary User Story

> As a Pakistani user who eats desi food daily, I want to photograph my meal and immediately understand what I am eating — without searching any database or entering any text.

### 3.2 User Stories

**Authentication**
- US-01: As a user, I can create an account with email and password
- US-02: As a user, I can sign in and my session persists across app restarts
- US-03: As a user, I can sign out from any device

**Onboarding**
- US-04: As a new user, I set my health goal (weight loss / muscle gain / curious) during onboarding
- US-05: As a new user, I set my dietary restrictions (Halal, Vegetarian, Gluten-Free, Dairy-Free)
- US-06: As a returning user, I skip onboarding entirely

**Food Recognition (Core Feature)**
- US-07: As a user, I can photograph a dish using my phone camera
- US-08: As a user, I can select an image from my photo gallery
- US-09: After scanning, I see the dish name and a confidence indicator within 5 seconds
- US-10: I see the dish's nutritional information (calories, protein, carbs, fat per serving)
- US-11: I see a 2–3 sentence plain-language insight personalised to my health goal
- US-12: When the model is uncertain (<70% confidence), I see the top 3 options and confirm which is correct
- US-13: When a dish has a precomputed Grad-CAM image, I can see which part of the photo the model focused on

**History**
- US-14: I can view all my past scans in a date-grouped feed
- US-15: I can tap any past scan to see the full result card
- US-16: My scan history is the same whether I access it on mobile or web

**Insights**
- US-17: I can see how many meals I scanned this week and my average calorie intake per meal
- US-18: I can see which dishes I scan most frequently
- US-19: Charts appear only after 3+ scans (zero-state is handled with a prompt to scan)

**AI Chatbot**
- US-20: I can ask questions about South Asian food and nutrition in natural language
- US-21: The chatbot's responses are personalised to my health goal and restrictions
- US-22: The chatbot offers suggested prompts when I open it for the first time

**Profile**
- US-23: I can view and edit my health goal and dietary restrictions
- US-24: I can view a static "About the Model" screen with architecture details, ablation results, and stated limitations

---

## 4. Functional Requirements

### 4.1 Food Recognition Engine

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | The system SHALL classify food images into one of 100 trained classes | Critical |
| FR-02 | The system SHALL return the top-3 predicted classes with confidence scores | Critical |
| FR-03 | When top-1 confidence ≥ 0.70, the system SHALL auto-accept and return a full result | Critical |
| FR-04 | When top-1 confidence < 0.70, the system SHALL set `low_confidence: true` and the UI SHALL show a disambiguation picker | High |
| FR-05 | The model SHALL be served as ONNX for CPU inference (no GPU required at runtime) | Critical |
| FR-06 | The system SHALL preprocess images to 224×224 pixels with ImageNet normalisation | Critical |
| FR-07 | Inference SHALL complete within 3 seconds on Render's free tier CPU | High |

### 4.2 Nutrition Lookup

| ID | Requirement | Priority |
|---|---|---|
| FR-08 | The system SHALL return calories, protein, carbs, and fat per standard serving for each recognised class | Critical |
| FR-09 | Nutrition data SHALL be served from a local JSON file — no external API dependency | Critical |
| FR-10 | If a food label has no nutrition entry, the response SHALL include a note field rather than null values | High |
| FR-11 | Nutrition values SHALL be per standard serving, not per 100g | Medium |

### 4.3 AI Insight Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | The system SHALL generate a 2–3 sentence insight for each food scan | Critical |
| FR-13 | The insight SHALL be personalised based on the user's health goal | High |
| FR-14 | Insights SHALL use a warm, non-judgmental tone and never describe food as unhealthy | High |
| FR-15 | If the AI API fails, the system SHALL return a graceful fallback string — never an error to the client | Medium |
| FR-16 | The AI model used SHALL be OpenRouter/Qwen (qwen/qwen-2.5-72b-instruct) | High |

### 4.4 Authentication and Profiles

| ID | Requirement | Priority |
|---|---|---|
| FR-17 | The system SHALL support email/password authentication via Supabase Auth | Critical |
| FR-18 | Sessions SHALL persist across app restarts using SecureStore (mobile) | Critical |
| FR-19 | A `profiles` row SHALL be auto-created for every new user via a database trigger | Critical |
| FR-20 | Users SHALL only be able to read and write their own data (Row Level Security) | Critical |
| FR-21 | The mobile app SHALL show onboarding to new users and skip it for returning users | High |

### 4.5 Scan History

| ID | Requirement | Priority |
|---|---|---|
| FR-22 | Every successful scan SHALL be saved to Supabase with: food label, confidence, top_3, nutrition, insight, image_url | Critical |
| FR-23 | The mobile app SHALL upload the scanned image to Supabase Storage and save the URL | High |
| FR-24 | Image upload failure SHALL be non-fatal — the scan row is saved with `image_url: null` | High |
| FR-25 | History SHALL be queryable in reverse chronological order | Medium |
| FR-26 | The same scan history SHALL be accessible on both mobile and web after login | Critical |

### 4.6 Grad-CAM Visualisation

| ID | Requirement | Priority |
|---|---|---|
| FR-27 | The system SHALL generate Grad-CAM heatmap images during model evaluation on Kaggle | High |
| FR-28 | Grad-CAM images SHALL be uploaded to Supabase Storage after training | High |
| FR-29 | The backend SHALL serve precomputed Grad-CAM URLs — NOT run PyTorch at inference time | Critical |
| FR-30 | The UI SHALL display the Grad-CAM image when `gradcam_sample_url` is present in the API response | Medium |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | End-to-end scan latency (image → result card) on WiFi | < 5 seconds |
| NFR-02 | Backend inference time (/predict endpoint) | < 3 seconds |
| NFR-03 | Backend cold start time on Render | < 45 seconds |
| NFR-04 | Model file size (ONNX) | < 25 MB |
| NFR-05 | Backend peak memory usage | < 512 MB (Render free tier limit) |

### 5.2 Accuracy

| ID | Requirement | Target |
|---|---|---|
| NFR-06 | Top-1 accuracy on the full validation set | ≥ 70% |
| NFR-07 | Top-3 accuracy on the full validation set | ≥ 85% |
| NFR-08 | Top-1 accuracy on South Asian dish classes | ≥ 65% |
| NFR-09 | EfficientNetB0 SHALL outperform MobileNetV2 on top-1 accuracy (ablation) | Positive margin |

### 5.3 Reliability

| ID | Requirement |
|---|---|
| NFR-10 | API failures SHALL return structured JSON error responses — never raw stack traces |
| NFR-11 | The app SHALL handle network errors gracefully with a retry option |
| NFR-12 | Supabase Storage upload failure SHALL not block the scan result from appearing |

### 5.4 Security

| ID | Requirement |
|---|---|
| NFR-13 | Row Level Security SHALL be enabled on all database tables |
| NFR-14 | The Supabase service role key SHALL never appear in mobile or web client code |
| NFR-15 | Auth tokens SHALL be stored in device SecureStore, not AsyncStorage |
| NFR-16 | All environment variables SHALL be excluded from git via `.gitignore` |

### 5.5 Usability

| ID | Requirement |
|---|---|
| NFR-17 | A new user SHALL be able to complete their first scan within 3 minutes of downloading the app |
| NFR-18 | The UI SHALL never use the word "unhealthy" or "bad" to describe food |
| NFR-19 | The empty state for History and Insights SHALL include a clear CTA to scan |
| NFR-20 | Low-confidence scans SHALL present options in plain language without technical jargon |

---

## 6. System Architecture

### 6.1 Component Overview

```
Mobile App (Expo)          Web Dashboard (Vite)
      │                          │
      └──────────┬───────────────┘
                 │ HTTP (multipart/form-data)
                 ▼
         Flask Backend (Render)
         ┌───────────────────────────────┐
         │  predict.py  (ONNX inference) │
         │  nutrition.py (local JSON)    │
         │  insights.py  (OpenRouter)    │
         │  gradcam_api.py (static URLs) │
         └───────────────────────────────┘
                 │
         Supabase (PostgreSQL + Storage)
         ┌───────────────────────────────┐
         │  profiles table               │
         │  scans table                  │
         │  scan-images bucket           │
         │  gradcam bucket               │
         └───────────────────────────────┘
```

### 6.2 Data Flow — Single Scan

```
1. User photographs or selects image on phone
2. Image compressed to < 500KB via expo-image-manipulator
3. POST /predict (multipart: image + user_goal)
4. Backend resizes image to 224×224, applies ImageNet normalisation
5. ONNX session runs inference → top-3 predictions + confidence scores
6. If confidence < 0.70 → return low_confidence: true (UI shows picker)
7. Nutrition looked up from nutrition_db.json (local, instant)
8. OpenRouter/Qwen generates 2-3 sentence insight
9. Grad-CAM URL looked up from gradcam_index.json
10. Full JSON response returned to client
11. Client renders ResultCard
12. Client uploads image to Supabase Storage (parallel)
13. Client inserts scan row to Supabase (includes image_url)
```

### 6.3 Training Pipeline

```
Food-101 (101 classes, 1000/class)
Khana 2025 (80 classes, 1638/class)   ──► curate_classes.py ──► unified_dataset/
DeshiFoodBD (19 classes, 285/class)        (merge, deduplicate,  (~100 classes,
Self-scraped (20 classes, 300-500/class)    drop <300 images)      all ≥300 images)
Pakistani dataset (supplementary)
                                                     │
                                              dataset.py (augmentation, class weights)
                                                     │
                                         Phase 1: freeze backbone, 5 epochs, LR=1e-3
                                                     │
                                         Phase 2: unfreeze last 20 layers, ≤15 epochs, LR=1e-4
                                                     │
                                              best_checkpoint.pth
                                                     │
                                    ┌────────────────┼──────────────────┐
                                 ablation.py    evaluate.py         export.py
                             (3 models compared) (metrics + Grad-CAM) (→ model.onnx)
```

---

## 7. Interface Specifications

### 7.1 REST API

**Base URL (production):** `https://nutrisense-api.onrender.com`  
**Base URL (development):** `http://192.168.x.x:5000`

#### POST /predict

```
Request:
  Content-Type: multipart/form-data
  image: File (JPEG or PNG, client compresses to <500KB)
  user_goal: string ('weight_loss' | 'muscle_gain' | 'curious')

Response 200:
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
  "gradcam_sample_url": "https://...supabase.co/storage/.../chicken_karahi_gradcam.png",
  "processing_time_ms": 1240
}

Response 400:
{ "error": "No image file in request" }
```

#### GET /health
```json
{ "status": "ok", "model_loaded": true, "classes": 100 }
```

#### GET /classes
```json
{ "0": "aloo_paratha", "1": "anda_paratha", ... "99": "tuna_tartare" }
```

### 7.2 Database Schema

```sql
profiles (
  id uuid PK → auth.users(id),
  goal text CHECK IN ('weight_loss','muscle_gain','curious') DEFAULT 'curious',
  restrictions text[] DEFAULT '{}',
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

scans (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id uuid → auth.users(id) ON DELETE CASCADE,
  food_label text NOT NULL,
  confidence float NOT NULL,
  top_3 jsonb,
  nutrition jsonb NOT NULL,
  insight text,
  image_url text,
  created_at timestamptz DEFAULT now()
)
```

RLS: users can only access their own rows.  
Trigger: `handle_new_user()` auto-creates a `profiles` row on sign-up.

### 7.3 Mobile Screen Map

```
/ (auth check)
├── /auth/login            Email + password, sign in / sign up toggle
├── /onboarding/goal       3 goal cards (weight_loss, muscle_gain, curious)
├── /onboarding/restrictions  Chip toggles (Halal, Vegetarian, GF, DF)
├── /onboarding/intro      3-step walkthrough + scan CTA
└── /(tabs)
    ├── /scan              Camera + gallery picker
    │   ├── /scan/result   API call, result card, Supabase insert
    │   └── /scan/confirm  Top-3 disambiguation (low_confidence)
    ├── /history           Date-grouped scan list
    │   └── /history/[id]  Read-only result card for past scan
    ├── /insights          Weekly stats, bar chart, chatbot CTA
    └── /profile           User settings
        ├── /profile/model About the Model (ablation, Grad-CAM, limitations)
        └── /chatbot       OpenRouter/Qwen chat interface
```

### 7.4 Web Page Map

```
/ (Landing)               Hero, How It Works, Model section, Sign Up CTA
/login                    Supabase auth
/dashboard                File upload → ResultCard
/history                  Sortable scan table, expandable rows
/insights                 Line + pie charts, most-scanned list
/chatbot                  OpenRouter/Qwen chat
/profile                  Goal/restrictions editor, About the Model accordion
```

---

## 8. Data Requirements

### 8.1 Training Dataset

| Source | Classes | Images/class | Total | Role |
|---|---|---|---|---|
| Food-101 | 101 | 1,000 | 101,000 | General food baseline |
| Khana 2025 | 80 | ~1,638 | ~131,000 | Primary South Asian backbone |
| DeshiFoodBD | 19 | ~285 | ~5,400 | Bangladeshi overlap |
| Self-scraped | 15–20 | 300–500 | ~8,000 | Pakistani gap fill |
| Pakistani dataset | 100 | ~49 | ~4,900 | Supplementary only |

**After curation:** ~100 classes, all with ≥300 images.

**Class imbalance handling:** `CrossEntropyLoss` with class weights computed via `sklearn.utils.compute_class_weight('balanced')`. This prevents Food-101 classes (1,000 images each) from dominating training.

### 8.2 Nutrition Database

- **Format:** JSON, one entry per class, values per standard serving
- **Fields:** `calories` (kcal), `protein` (g), `carbs` (g), `fat` (g)
- **Source:** USDA FoodData Central for international dishes; published Pakistani nutrition tables for desi dishes
- **Coverage:** All 100 classes must have entries; zero values with a `note` field are acceptable for unknowns
- **Location:** `data/nutrition_db.json`

### 8.3 User Data

- Scan images stored in Supabase Storage (`scan-images` bucket, public read)
- Scan metadata stored in PostgreSQL (`scans` table)
- No PII beyond email address (collected by Supabase Auth)
- No scan data shared between users

---

## 9. Design Decisions and Rationale

### 9.1 Model — EfficientNetB0

**Decision:** Use EfficientNetB0 over MobileNetV2, InceptionV3, ResNet50, EfficientNetB7.

**Rationale:**
- EfficientNetB0 achieves 97.54% accuracy on Food-101 with fine-tuning (IJIIS 2024) — highest in its parameter class
- 5.3M parameters — small enough to export as ONNX and serve on Render's 512MB free tier
- EfficientNetB7 (66M params) would exceed the memory limit
- MobileNetV2 (3.4M) is lighter but ~6% less accurate in our ablation
- ResNet50 (25.6M) uses too much memory for the free tier and is less accurate than EfficientNetB0

### 9.2 Inference — ONNX Runtime (not PyTorch)

**Decision:** Export to ONNX after training; load with onnxruntime at inference time.

**Rationale:**
- PyTorch CPU wheel: ~700MB. Render free tier RAM: 512MB. PyTorch would cause OOM on cold start.
- onnxruntime CPU wheel: ~12MB
- ONNX inference is 20–40% faster than PyTorch for single-image inference
- Grad-CAM (which requires PyTorch autograd) is precomputed during evaluation — not at runtime

### 9.3 Dataset — Khana 2025 as South Asian Backbone

**Decision:** Replace the Tahir 2020 Pakistani dataset as the primary South Asian source with Khana 2025.

**Rationale:**
- Tahir 2020 has ~49 images/class — too few for reliable fine-tuning (supervisor confirmed 500+ needed)
- Khana 2025 has ~1,638 images/class across 80 Indian food classes
- ~70% of Khana's classes (biryani, samosa, naan, korma, dal, pakora, halwa, kheer) are shared between Indian and Pakistani cuisine
- This is the academically stronger position: "We leverage the most comprehensive available South Asian dataset and supplement with original scraped data for Pakistani-specific classes absent from the literature"

### 9.4 Nutrition — Local JSON (not API)

**Decision:** Nutrition data served from a local `nutrition_db.json` file, not Nutritionix or USDA API.

**Rationale:**
- Nutritionix consistently returns wrong values for desi dishes (generic "Indian curry" instead of karahi-specific values)
- No API rate limits, no API key dependency, offline-capable
- Values are manually curated from USDA FoodData Central — more accurate for our specific classes
- For a FYP, controlling the data is a stronger academic position than delegating to a third-party

### 9.5 AI Insights — OpenRouter/Qwen

**Decision:** Use OpenRouter (qwen/qwen-2.5-72b-instruct) for insight generation instead of Gemini.

**Rationale:**
- OpenRouter free tier has no per-minute rate limit for Qwen models
- Qwen 2.5 72B performs comparably to GPT-4 on instruction-following benchmarks
- API is OpenAI-compatible (easy to switch models without changing code)
- No Google account dependency

### 9.6 Backend Framework — Flask

**Decision:** Use Flask over FastAPI, Django REST Framework, Express.

**Rationale:**
- ONNX inference runs in Python natively — no need for inter-process communication
- Flask has minimal overhead for the 3 endpoints this system needs
- The team has Python familiarity; FastAPI would add type annotation overhead without benefit at this scale
- Gunicorn provides production-grade WSGI serving with one Procfile line

### 9.7 Mobile — Expo Router (file-based routing)

**Decision:** Use Expo Router over React Navigation.

**Rationale:**
- File-based routing mirrors the mental model of web development (Next.js conventions)
- Reduces boilerplate — each screen is just a file, no navigator configuration needed
- Better TypeScript path inference for routes
- The team is more familiar with web-style routing conventions

### 9.8 Confidence Threshold — 0.70

**Decision:** Auto-accept predictions with confidence ≥ 0.70; show disambiguation picker below this.

**Rationale:**
- Pakistani dishes have high visual similarity (karahi, handi, qorma all look like reddish/oily meat in a dish)
- At 0.70, false positives are rare enough that the auto-accept UX is smooth
- Below 0.70, presenting top-3 options mirrors how production food recognition apps (Google Lens, MyFitnessPal camera) handle uncertainty
- This threshold is adjustable via environment variable (`CONFIDENCE_THRESHOLD`)

---

## 10. Constraints and Limitations

### 10.1 Technical Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| No portion size estimation | Nutrition values are per standard serving, not per plate | State explicitly in UI and viva |
| Mixed-dish scenes (thaali, dastarkhaan) | Only the dominant food is classified | Show one result, acknowledge in limitations |
| Pakistani dish accuracy lower than Food-101 | Fewer training images per class | Covered by Khana dataset supplementation and scraping |
| ONNX-only backend (no Grad-CAM at runtime) | Heatmaps are precomputed samples, not image-specific | Academically defensible; stated in About the Model |
| Render free tier cold start | 30–45 second delay on first request after inactivity | Known limitation of free hosting; acceptable for demo |

### 10.2 Scope Limitations

These were explicitly out of scope and should be stated proactively at the viva:

- **No clinical validation:** The system is not validated for medical or dietary advice
- **No real-time video:** Recognition requires a single still photograph
- **No multi-user sharing:** Each user's scans are private and not aggregatable
- **No offline inference:** The app requires network connectivity to reach the backend
- **No Urdu language support:** UI is English-only in this version

### 10.3 Research Limitations

- The model is trained on web-scraped and publicly available images, which may not represent home-cooked variants of Pakistani dishes
- Nutritional values are generic standard-serving figures — home-cooked versions vary significantly
- The self-scraped dataset has not been peer-reviewed for quality

---

## 11. Acceptance Criteria

The system is considered complete when all of the following pass:

| # | Criterion | Test Method |
|---|---|---|
| AC-01 | `GET /health` returns `model_loaded: true` | curl command |
| AC-02 | `POST /predict` with a karahi photo returns label "chicken_karahi" or "karahi" with confidence ≥ 0.70 | Manual photo test |
| AC-03 | Low-confidence scan returns `low_confidence: true` and 3 plausible alternatives | Use a blurred/ambiguous photo |
| AC-04 | Nutrition values are non-zero for common South Asian dishes | Check response JSON |
| AC-05 | Insight text is 2–3 sentences, culturally appropriate, mentions the user's goal | Manual review of 5 samples |
| AC-06 | Mobile: scan → result card within 5 seconds on WiFi | Stopwatch test on device |
| AC-07 | Mobile: history tab updates after new scan | Scan → switch tabs |
| AC-08 | Mobile: chatbot responds to "Is karahi good for muscle gain?" | Manual test |
| AC-09 | Web: upload zone → result card renders | Browser test |
| AC-10 | Web: history table shows all scans, sorted correctly | Browser test |
| AC-11 | Cross-platform: sign up on web → sign in on mobile → same scans visible | Test with two devices |
| AC-12 | Ablation results show EfficientNetB0 outperforms MobileNetV2 and ResNet50 | Check ablation_results.csv |
| AC-13 | Top-1 accuracy ≥ 70% on validation set | Check results.json |
| AC-14 | Top-3 accuracy ≥ 85% on validation set | Check results.json |
| AC-15 | About the Model screen shows ablation table and limitations | UI inspection |
