# NutriSense AI — Documentation

**Pakistani and South Asian Food Recognition System** · Final Year Project

| | |
|---|---|
| **Project Title** | NutriSense AI |
| **Project Type** | Final Year Project (IT Specialization) |
| **Institution** | Institute of Business & Information Technology (IBIT), University of the Punjab |
| **Team** | Beenish Ashraf (F22BA018) · Sameen Naz (F22BA019) · Zeeshan Haider (F22BA025) · Azka Sajid (F22BA031) |
| **Supervisor** | Dr Hassan Khan |
| **Document Version** | 2.0 (web deliverable) |

## Live production endpoints

| Surface | URL |
|---|---|
| Web (custom domain) | <https://nutrisenseai.tech> |
| Backend API | <https://nutrisense-msq1.onrender.com> |
| Source code | <https://github.com/zeeshandesigns/NutriSense> |

## Contents

| Document | Description |
|---|---|
| [setup.md](setup.md) | Manual setup checklist — accounts, keys, Supabase, env files, local run, training, deployment |
| [application.md](application.md) | Project overview, headline metrics, system architecture, tech stack, feature list, academic contribution |
| [hosting.md](hosting.md) | Live URLs, provider rationale (Render · Vercel · Supabase · Modal · OpenRouter), cost summary, deploy workflow |
| [test-cases.md](test-cases.md) | Detailed test cases across authentication, scan, history, insights, profile, backend API, performance, and edge cases |
| [system-testing.md](system-testing.md) | Testing strategy, environment, FR→TC traceability, model evaluation, bug log, risks, sign-off |
| [screenshots/](screenshots/) | Screenshot capture checklist and committed PNGs |

## Submission summary

- **Backend API automated test suite:** 6 / 6 Pass against the live Render deployment
- **Model accuracy:** Top-1 = 82.65 %, Top-3 = 93.65 % on a held-out 20 % validation split (270 classes)
- **Defect gate:** 0 P0, 0 P1 — within submission gate
- **Deployment:** all three tiers (web, backend, database) live on free-tier infrastructure; cumulative training spend ≈ $7 USD

---

*Internal working notes (SRS, demo runbook, provider walkthroughs) are kept local and are intentionally excluded from this public repository.*
