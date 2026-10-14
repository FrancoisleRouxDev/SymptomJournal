# SymptomJournal 🌿
> *"Log it calmly. Understand it clearly. Talk to your doctor with confidence."*

[![Milestone 2](https://img.shields.io/badge/Milestone%202-Complete%20(100%25)-3D6456?style=for-the-badge&logo=checkmarx)](docs/MILESTONE_2_DOCUMENTATION.md)
[![Release](https://img.shields.io/badge/Release-v1.0.1%20APK-C86D51?style=for-the-badge&logo=android)](https://github.com/FrancoisleRouxDev/SymptomJournal/releases/tag/v1.0.1)
[![Tests](https://img.shields.io/badge/Tests-94%20Passing-brightgreen?style=for-the-badge&logo=jest)](frontend/src/__tests__)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Cloud-009688?style=for-the-badge&logo=fastapi)](https://symptomjournal.onrender.com/docs)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

A mobile health companion engineered to replace the anxiety of Googling symptoms with calm, structured self-awareness. Users log their physical and emotional symptoms in seconds, discover temporal correlations powered by NVIDIA NIM AI, and export clinical SBAR doctor summaries directly to PDF for medical appointments.

---

## 📲 Quick Links & Live Deployments

| Resource | Link | Description |
|:---|:---|:---|
| **Android APK (Latest)** | [**Download v1.0.1 APK**](https://github.com/FrancoisleRouxDev/SymptomJournal/releases/download/v1.0.1/SymptomJournal-v1.0.1.apk) | Direct installable Android build with brand icons & splash |
| **GitHub Releases** | [**SymptomJournal Releases**](https://github.com/FrancoisleRouxDev/SymptomJournal/releases) | Release notes, changelog, and standalone APK binaries |
| **Cloud API (Live)** | [**symptomjournal.onrender.com**](https://symptomjournal.onrender.com) | Production FastAPI backend hosted on Render |
| **Interactive API Docs** | [**Swagger UI Documentation**](https://symptomjournal.onrender.com/docs) | Interactive OpenAPI testing console with auth & analysis routes |
| **Presentation Script** | [**Milestone 2 Script**](docs/MILESTONE_2_PRESENTATION_SCRIPT.md) | 3-minute demo guide & rubric defense for lecturers |
| **Technical Report** | [**Milestone 2 Report**](docs/MILESTONE_2_DOCUMENTATION.md) | In-depth architecture, risk mitigation, and testing log |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React Native (Expo SDK 57)           │
│   • Expo Router (Tabs & Stacks)   • Lucide Icons       │
│   • Persistent Session (AsyncStorage + AppState)       │
│   • Shimmer Skeleton Loaders      • Print / PDF Export │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
      Supabase Auth                     JWT Bearer Auth
     (ES256 / HS256)                   (Axios Interceptor)
            │                                │
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│  Supabase PostgreSQL  │        │   FastAPI (Python)    │
│  • users              │◄───────┤   • /symptoms         │
│  • symptom_logs       │ (CRUD) │   • /analysis         │
│  • Row-Level Security │        │   • /auth (Swagger)   │
└───────────────────────┘        └───────────┬───────────┘
                                             │
                                     Secure Server Key
                                             ▼
                                 ┌───────────────────────┐
                                 │      NVIDIA NIM       │
                                 │  Llama 3.3 70B / 3.2  │
                                 │  • Pattern Discovery  │
                                 │  • Clinical SBAR Summ │
                                 │  • Safe Rx Assistant  │
                                 └───────────────────────┘
```

---

## ✨ Core Feature Showcase

### 1. 📝 Structured Symptom Logging
* **Fast 15-second entry:** 6 major categories (*Pain, Fatigue, Mood, Digestion, Breathing, Skin*) with specialized subcategories.
* **Granular Tracking:** 1–10 visual severity slider, interactive body area selectors, onset timing presets, customizable lifestyle triggers, and contextual notes.
* **Instant Persistence:** Automatically saved to Supabase PostgreSQL with optimistic state updates.

### 2. 📅 Chronological Timeline & Filters
* **Visual Calendar Feed:** Chronological history grouped by date with category badge indicators.
* **Dynamic Filtering:** Filter history by category tabs and review severity levels over time.

### 3. 🧠 AI Pattern Recognition (Core AI)
* **Multi-Entry Synthesis:** Requires $\ge 3$ entries to unlock deep trend analysis.
* **Correlations Detected:** Temporal patterns (e.g., *"Headaches cluster around late afternoons"*), lifestyle trigger links (*"Poor sleep correlates with 80% of fatigue spikes"*), and calm lifestyle advice.
* **UX Continuity:** Shimmer skeleton loaders provide immediate visual feedback while the LLM generates inferences.

### 4. 💬 AI Medication & Health Assistant
* **Safe Clinical Guardrails:** Conversational assistant answering questions on over-the-counter medications, potential interactions, and general usage guidelines.
* **Proactive Disclaimers:** System prompts strictly forbid medical prescriptions or diagnostic claims, reminding users to verify instructions with their pharmacist.

### 5. 📄 Clinical Doctor Summary & PDF Export
* **SBAR Format:** Formats logged patient history into a structured briefing (*Situation, Background, Assessment, Recommendation*) specifically formatted for physicians.
* **Native PDF Compilation:** Generates a clean, print-ready medical report via `expo-print` with one-tap system sharing and native printing.

### 6. 🔐 Auth & Persistent Session
* **Supabase JWT:** Secure email/password authentication, automatic user profile creation in PostgreSQL, and 1-click **Guest Access** for demo evaluators.
* **App Closure Persistence:** Native `AppState` listeners and `AsyncStorage` keep the user logged in across complete app terminations and re-launches.

---

## 🎨 Design System & Brand Identity

The design system prioritizes a calm, non-alarmist medical experience:

| Token | Hex Code | Visual Application |
|:---|:---|:---|
| **Sage Dark** | `#5A7D66` | Primary buttons, active badges, Android adaptive background |
| **Sage Base** | `#7B9E87` | Logo squircle, accents, sliders, tab active highlights |
| **Terracotta** | `#C86D51` | Subtle brand accent dot, critical category highlights |
| **Warm Canvas** | `#F6F0E8` | Native splash screen background, app screen canvas |
| **Card / Element**| `#FDFAF5` | Elevated cards, symptom form containers |
| **Deep Brown** | `#3E2D1E` | Typography headings (DM Serif Display) |
| **Muted Brown** | `#6A5A4E` | Body and secondary text (Nunito) |

---

## 🧪 Testing & Verification

The application maintains a dual automated testing suite spanning both frontend and backend architectures:

### Frontend Unit & Integration Tests (Jest)
```powershell
cd frontend
npm test
```
* **54 Tests Passing** across 7 test suites (**94.6% code coverage**):
  * `auth.test.ts` — Session recovery, authentication flows, and profile updates.
  * `api.test.ts` — Axios interceptors, JWT attachment, and error handling.
  * `pdf-export.test.ts` — SBAR HTML formatting, system share dialog, and print fallbacks.
  * `SkeletonLoader.test.tsx` — Shimmer loading state animations across tab views.
  * `symptom-validation.test.ts` — Category bounds, severity constraints (1–10).
  * `theme.test.ts` — Color token maps and semantic palettes.
  * `components.test.tsx` — Custom typography and themed wrappers.

### Backend Unit & Integration Tests (pytest)
```powershell
cd backend
.\.venv\Scripts\pytest --cov=routers --cov=services
```
* **40 Tests Passing** (**77% statement coverage**):
  * `test_auth.py` — Supabase JWT verification (`ES256` / `HS256`) and profile auto-sync.
  * `test_symptoms.py` — Input validation (Pydantic constraints) and CRUD logic.
  * `test_ai_service.py` — LLM mocking, JSON fence stripping, fallback recovery.

### End-to-End Live Subsystem Healthcheck
```powershell
cd backend
python tests/e2e_healthcheck.py
```
* Directly probes live Supabase database tables, NVIDIA NIM inference, FastAPI security guards, and Render cloud hosting (`200 OK`).

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js** $\ge 18$
* **Python** $\ge 3.11$
* **Expo Go** on Android/iOS (or Android Emulator)

### 1. Clone Repository
```bash
git clone https://github.com/FrancoisleRouxDev/SymptomJournal.git
cd SymptomJournal
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*Backend Swagger Docs will be accessible at: `http://localhost:8000/docs`*

### 3. Frontend Setup (React Native / Expo)
```bash
cd ../frontend
npm install
npm start
```
*Scan the QR code in your terminal with Expo Go (Android) or the Camera app (iOS).*

---

## 🗺️ Project Roadmap & Status

- [X] **Phase 1 — Setup & Scaffolding** (Brand design tokens, typography, navigation skeleton)
- [X] **Phase 2 — Auth & Symptom Logging** (Supabase Auth, category grid, severity sliders)
- [X] **Phase 3 — AI Integration via FastAPI** (NVIDIA NIM, pattern detection, safety guardrails)
- [X] **Phase 4 — Core Features & Screens** (Timeline, Doctor Summary, Medication Chatbot, Profile)
- [X] **Phase 5 — Polish, Testing & Persistence** (94 automated tests, shimmer loaders, session persistence)
- [X] **Phase 6 — Cloud Deployment & Release** (Render cloud backend, GitHub Release v1.0.1 APK)
- [ ] **Phase 7 — Qualitative User Testing** (Weeks 3–4: 5 peer testing sessions, feedback refinement)

---

## 🎓 Academic Module
**Module:** Interactive Development 300 (DV300) – Theme 4: AI-Driven Application  
**Institution:** The Open Window Institute  
**Student:** Francois le Roux (231256)  
**Milestone Date:** Wednesday, 14 October 2026 | **Final Submission:** 28 October 2026
