# NutriSense AI

Pakistani and South Asian food recognition system. Fine-tuned EfficientNetB0 CNN deployed as a React Native mobile app and React web dashboard.

## Team

| Team | Members | Stack |
|---|---|---|
| Frontend | 2 devs | React Native + Expo (mobile), React + Vite (web) |
| Backend/AI | 2 devs | Flask, PyTorch, EfficientNetB0, Supabase, Render |

## Documentation

| File | Purpose | Who reads it |
|---|---|---|
| [`docs/CONTEXT.md`](docs/CONTEXT.md) | Shared project bible — architecture, API contract, DB schema, design system | Everyone, every session |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | 7-phase AI build guide for the frontend team | Frontend team |
| [`docs/BACKEND.md`](docs/BACKEND.md) | 5-phase AI build guide for the backend/AI team | Backend team |

## How to use these docs

Each developer gives their AI the shared `CONTEXT.md` plus their team-specific file at the start of every session. Say:

> *"Read both files carefully. I am working on Phase X of FRONTEND.md / BACKEND.md. Build exactly as specified."*

This avoids re-explaining the project context each session and keeps both teams building toward the same API contract and database schema.

## FYP Academic Contribution

Fine-tuned EfficientNetB0 for South Asian cuisine — a documented research gap confirmed by Scientific Reports (2025) and Tahir et al. (2020). The model is trained on a curated multi-source dataset combining Food-101, Khana 2025 (131K images), DeshiFoodBD, and original self-scraped Pakistani food classes.
