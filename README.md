# SymptomJournal
> *"Log it calmly. Understand it clearly. Talk to your doctor with confidence."*

<p align="center">
  <img src="docs/images/mockup_hero_showcase.jpg" alt="SymptomJournal Hero Device Showcase" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/FrancoisleRouxDev/SymptomJournal/releases"><img src="https://img.shields.io/badge/Release-v1.0.4-C86D51?style=for-the-badge&logo=github" alt="Release v1.0.4" /></a>
  <a href="frontend/src/__tests__"><img src="https://img.shields.io/badge/Automated_Tests-110_Passing-brightgreen?style=for-the-badge&logo=jest" alt="110 Tests Passing" /></a>
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-SDK%2057%20(iOS%20%26%20Android)-000020?style=for-the-badge&logo=expo" alt="Expo SDK 57" /></a>
  <a href="https://symptomjournal.onrender.com/docs"><img src="https://img.shields.io/badge/Backend-FastAPI%20Cloud-009688?style=for-the-badge&logo=fastapi" alt="FastAPI Backend" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase Postgres" /></a>
  <img src="https://img.shields.io/badge/Theme-Dark%20%26%20Light%20Mode-5A7D66?style=for-the-badge" alt="Dark & Light Mode" />
</p>

---

## Overview

**SymptomJournal** is a full-stack, cross-platform mobile health companion designed to replace the panic and anxiety of Googling symptoms with calm, structured self-awareness.

Patients living with chronic or recurring symptoms often struggle to communicate patterns during brief consultations. SymptomJournal empowers users to log physical and emotional symptoms in under **15 seconds**, discovers subtle temporal correlations via **NVIDIA NIM LLMs**, and generates a physician-aligned **Clinical SBAR (Situation, Background, Assessment, Recommendation) PDF Summary** ready for every appointment.

Every interface token is tailored for soothing visual accessibility: warm linen tones, sage and terracotta accents, bespoke serif typography, full dark mode, and dynamic font scaling.

---

## Quick Links & Live Deployments

| Resource | Link | Description |
|:---|:---|:---|
| **GitHub Releases** | [SymptomJournal Releases](https://github.com/FrancoisleRouxDev/SymptomJournal/releases) | Latest release notes, binary downloads, and changelog |
| **Android APK (v1.0.4)** | [Download Android APK](https://github.com/FrancoisleRouxDev/SymptomJournal/releases) | Native installable Android APK with adaptive brand icons & splash |
| **iOS Simulator Build** | [iOS Simulator (.tar.gz)](https://expo.dev/artifacts/eas/evplY85VchJ5j7K3TtDT6uXIu1fE2h_BfyZBJYh9l9s.tar.gz) | Apple iOS Simulator build ready for Appetize.io or Xcode Simulator |
<!-- | **Production API** | [symptomjournal.onrender.com](https://symptomjournal.onrender.com) | FastAPI backend deployed with live CORS and health monitoring | -->
| **API Documentation** | [Swagger UI Console](https://symptomjournal.onrender.com/docs) | OpenAPI interactive testing sandbox with auth and analysis routes |
| **Patient User Journey** | [User Journey Map](docs/USER_JOURNEY.md) | Complete end-to-end patient experience map & visual flow diagram |
| **Database ERD** | [Entity Relationship Diagram](docs/ERD-Diagram.png) | PostgreSQL schema diagram with foreign keys and relationships |
| **Technical Architecture** | [Technical Documentation](docs/MILESTONE_2_DOCUMENTATION.md) | Database schemas, token dictionaries, and safety guardrails |

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│             React Native (Expo SDK 57)                 │
│   • Expo Router (File-based Tabs & Stacks)             │
│   • Lucide Native Icons & Bespoke Theme System         │
│   • Dynamic Text Scaling (85% – 130%)                  │
│   • Custom Triggers & Anatomical Region Selectors      │
│   • Publication-Grade Print & PDF Export (expo-print)  │
│   • Native Push Notifications (expo-notifications)     │
│   • Resilient AsyncStorage & AppState Auth Observer    │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
      Supabase Auth                     JWT Bearer Auth
     (ES256 / HS256)                   (Axios Interceptor)
            │                                │
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│  Supabase PostgreSQL  │        │   FastAPI (Python)    │
│  • users profile      │◄───────┤   • /symptoms (CRUD)  │
│  • symptom_logs       │ (CRUD) │   • /analysis (AI)    │
│  • Row-Level Security │        │   • /chat (Assistant) │
└───────────────────────┘        └───────────┬───────────┘
                                             │
                                     Secure Server Key
                                             ▼
                                 ┌───────────────────────┐
                                 │      NVIDIA NIM       │
                                 │  Llama 3.3 70B / 3.2  │
                                 │  • Pattern Discovery  │
                                 │  • Clinical SBAR Summ │
                                 │  • Guardrailed AI Rx  │
                                 └───────────────────────┘
```

---

## Patient User Journey & Screen Navigation Flow

SymptomJournal guides patients from initial onboarding and structured daily tracking through to actionable AI correlations and clinical SBAR consultation summaries ([read the in-depth journey specification](docs/USER_JOURNEY.md)):

<p align="center">
  <img src="docs/images/user_journey_flow.png" alt="SymptomJournal Patient User Journey & Screen Flow" width="100%" />
</p>

### Navigation Structure & Flow Legend

* **Onboarding & Authentication:**
  * **Onboarding 1, 2, 3:** Sequential introductory walkthrough presenting the app's three core value propositions.
  * **Sign Up (Step 1 & 2):** Two-step registration capturing credentials, demographics, and personal health goals.
  * **Sign In:** Returning user session recovery with quick tour replay option.
* **Central Hub:**
  * **Home Dashboard:** Daily wellness score, day streaks, recent symptoms feed, and AI alert nudge.
  * **Profile:** Health statistics and achievements, routing to Edit Profile and Settings.
* **Feature Branches:**
  * **Log Symptom:** 15-second category, severity slider (1–10), body area, and lifestyle triggers → Symptom Saved → returns to Dashboard.
  * **Symptom Timeline:** Visual calendar dot indicators and category filter chips with full log management.
  * **AI Insights:** Weekly trend charts and plain-language temporal findings → Doctor Summary (Clinical SBAR) → Export PDF.
  * **AI Assistant:** Conversational medication chat with interactive prompt chips and safety disclaimers.
  * **Push Notifications:** Configurable daily reminder time picker with native Android channel integration.

---

## Database Architecture & Entity Relationship Diagram

The data layer is managed on **Supabase PostgreSQL** with strict Row-Level Security (RLS) policies ensuring patients can exclusively access and export their own medical history.

<p align="center">
  <img src="docs/ERD-Diagram.png" alt="SymptomJournal Entity Relationship Diagram" width="100%" />
</p>

### Relational Schema & Data Dictionary

| Table | Primary Key | Foreign Keys | Key Columns | Purpose |
|:---|:---|:---|:---|:---|
| **`Users`** | `id` (uuid) | — | `name`, `email`, `date_of_birth`, `notification_preferences` (jsonb), `onboarding_completed` | Core patient identity, auth credentials, and notification settings. |
| **`Common_Conditions`** | `id` (uuid) | `user_id` → `Users.id` | `condition_name`, `noted_at` | Pre-existing medical conditions used for clinical background context. |
| **`Symptom_Logs`** | `id` (uuid) | `user_id` → `Users.id` | `description`, `severity` (1–10), `time_of_day`, `mood`, `created_at` | Primary log recording each symptom event, intensity score, and temporal context. |
| **`Triggers`** | `id` (uuid) | `log_id` → `Symptom_Logs.id` | `trigger_type`, `trigger_value`, `noted_at` | Correlated lifestyle and environmental factors (e.g., Poor Sleep, Stress, Weather). |
| **`AI_Analysis`** | `id` (uuid) | `user_id` → `Users.id` | `patterns_identified`, `trigger_summary`, `recommendation`, `entries_analysed` | Cached LLM inference results, temporal trend syntheses, and lifestyle recommendations. |
| **`Doctor_Summaries`** | `id` (uuid) | `user_id` → `Users.id`<br>`analysis_id` → `AI_Analysis.id` | `summary_text` (SBAR), `date_range_start/end`, `exported` (bool) | Physician-ready clinical reports with consultation discussion points and export timestamps. |
| **`Notifications`** | `id` (uuid) | `user_id` → `Users.id` | `type`, `sent_at`, `read` (bool) | In-app reminders for scheduled logging check-ins and new AI pattern alerts. |

---

## Core Feature Showcases

### 1. Granular Symptom Logging & Chronological Timeline

<p align="center">
  <img src="docs/images/mockup_logging_timeline.jpg" alt="Symptom Logging and Timeline Mockup" width="100%" />
</p>

* **15-Second Entry Workflow:** Six core physiological categories (*Pain, Fatigue, Mood, Digestion, Breathing, Skin*) with specific clinical subcategories.
* **Severity & Onset Presets:** Interactive tactile slider with visual colour cues and time offsets (*Now, 1h ago, 3h ago, Earlier*).
* **Anatomical Mapping:** Select from primary body regions or save custom anatomical locations.
* **Lifestyle & Environmental Triggers:** Track factors such as *Poor Sleep, Screen Glare, Dehydration, Stress, Exercise* or add custom triggers.
* **Interactive Calendar Timeline:** Visual calendar indicator dots marking active logging days, category filter badges, and expandable symptom cards.

---

### 2. Clinical SBAR Doctor Summary & Print-Ready PDF Export

<p align="center">
  <img src="docs/images/mockup_clinical_summary.jpg" alt="Clinical Doctor Summary Mockup" width="100%" />
</p>

* **Standardised SBAR Protocol:** Formats raw patient data into physician-aligned sections:
  * **S (Situation):** Key chief complaints and primary logging period.
  * **B (Background):** Existing diagnosed conditions and known triggers.
  * **A (Assessment):** AI-synthesised severity clusters, frequency distributions, and temporal trends.
  * **R (Recommendation):** Tailored patient–physician conversation starters and discussion questions.
* **Frequency & Severity Breakdown:** Visual occurrence bars and average intensity metrics per symptom type.
* **One-Tap PDF Export:** Generates clean, publication-grade clinical printouts via `expo-print` and `expo-sharing`.

---

### 3. Safe AI Medication & Health Assistant

<p align="center">
  <img src="docs/images/mockup_ai_medication.jpg" alt="AI Medication Assistant Mockup" width="100%" />
</p>

* **Conversational Guidance:** Instant answers regarding over-the-counter medications, potential interactions, common side effects, and home comfort measures.
* **Interactive Quick-Question Chips:** Tap common enquiries to begin a conversation immediately.
* **Non-Diagnostic Guardrails:** Built-in medical disclaimers reminding patients that AI guidance does not replace professional medical diagnosis or prescription orders.
* **Bespoke Chat Interface:** Sage-accented dialogue bubbles, loading shimmer indicators, and native Lucide send controls.

---

### 4. Calming Patient Onboarding & First-Run Experience

<p align="center">
  <img src="docs/images/mockup_onboarding_trio.jpg" alt="Onboarding Trio Mockup" width="100%" />
</p>

* **Three-Step Guided Tour:**
  1. *Track What Your Body Says* — Log symptoms in seconds without cognitive overload.
  2. *Spot Patterns Before They Worsen* — Discover AI correlations between sleep, diet, and flare-ups.
  3. *Share Clearly With Your Doctor* — Arrive at every consultation prepared with a clinical SBAR report.
* **Onboarding Replay:** Easily review the onboarding tour at any time from Settings.

---

### 5. AI Pattern Recognition & Trend Analytics

<p align="center">
  <img src="docs/images/mockup_hero_showcase.jpg" alt="AI Pattern Recognition and Analytics" width="100%" />
</p>

* **Automated Trend Detection:** Evaluates logging history once ≥ 3 logs are recorded.
* **Weekly Overview Charts:** Comparative bar visualiser plotting symptom trajectories over time.
* **Actionable Key Findings:** Plain-language discoveries (*e.g., "Headaches occur 85% more often after fewer than 5 hours of sleep"*).
* **Smooth Loading States:** Shimmer skeleton loaders protect visual continuity during network inference.

---

### 6. Inclusive Accessibility & Complete Theming

| Light Theme | Dark Theme |
|:---:|:---:|
| <img src="docs/images/mockup_theme_light.jpg" width="100%" alt="Light Theme Mockup" /> | <img src="docs/images/mockup_theme_dark.jpg" width="100%" alt="Dark Theme Mockup" /> |
| **Warm Linen Canvas (`#F6F0E8`)**<br>Soothing daytime palette with sage & terracotta | **Deep Slate Canvas (`#1C1917`)**<br>Low-strain evening palette with luminous sage glow |

* **Calming Colour System:** Warm linen light canvas, deep slate dark canvas, sage primary, and terracotta warning accents.
* **Instant Theme Toggle:** Switch seamlessly from Settings with full persistence across all tabs and modal stacks.
* **Dynamic Typography Scaling:** Small (85%), Medium (100%), Large (115%), and Extra Large (130%) text scaling without visual clipping.

---

## Design System Tokens

| Token | Light Mode | Dark Mode | Usage |
|:---|:---|:---|:---|
| **Canvas Background** | `#F6F0E8` (Warm Linen) | `#1C1917` (Deep Slate) | Screen backdrops & safe area canvas |
| **Card / Elevated Surface** | `#FDFAF5` (Off-White) | `#292524` (Muted Slate) | Content cards, form groups & modals |
| **Primary Brand (Sage)** | `#5A7D66` / `#7B9E87` | `#8BAE97` | Active tabs, CTAs, wellness indicators |
| **Secondary Brand (Terracotta)** | `#C4714F` / `#A85A38` | `#D97A5C` | High-severity alerts, action buttons |
| **Primary Typography** | `#3E2D1E` (Deep Bark) | `#F6F0E8` (Ivory Soft) | Headings — DM Serif Display |
| **Secondary Typography** | `#6A5A4E` (Muted Soil) | `#C8BFB5` (Warm Grey) | Body copy & subtext — Nunito |
| **Border & Divider** | `#C8BFB5` | `#44403C` | Card strokes, chip outlines & rules |

---

## Automated Testing

SymptomJournal features automated test suites verifying correctness across client UI logic, PDF layout, API security, and AI service layers.

### Frontend — Jest & React Native Testing Library
```bash
cd frontend && npm test
```

| Suite | Coverage |
|:---|:---|
| `onboarding.test.tsx` | Onboarding screens and icon rendering |
| `symptom-validation.test.ts` | Severity bounds (1–10), category mappings, and timestamp validation |
| `auth.test.ts` | Authentication state recovery, sign-in/up logic, and profile updates |
| `api.test.ts` | Axios interceptors, authorization headers, and error handling |
| `pdf-export.test.ts` | Clinical HTML generation, patient headers, and sharing fallbacks |
| `theme.test.ts` | Design tokens, contrast ratios, and theme switcher state |
| `components.test.tsx` | Custom typography scaling and themed view containers |
| `SkeletonLoader.test.tsx` | Shimmer loading animations across tab views |

**61 tests passing** across 8 suites.

### Backend — pytest & FastAPI TestClient
```bash
cd backend && .venv/Scripts/python -m pytest
```

| Suite | Coverage |
|:---|:---|
| `test_analysis.py` | SBAR summary generation, trend heuristics, and pattern synthesis |
| `test_auth.py` | Supabase JWT verification (ES256 / HS256) and user profile sync |
| `test_symptoms.py` | Input validation (Pydantic models) and database CRUD endpoints |
| `test_ai_service.py` | LLM prompt templating, markdown fence stripping, and fallback handling |

**49 tests passing** across 4 suites.

**Total: 110 automated tests passing.**

---

## Local Development Setup

### Prerequisites
* Node.js ≥ 18
* Python ≥ 3.11
* Expo Go on Android/iOS, or an Android/iOS emulator

### 1. Clone the Repository
```bash
git clone https://github.com/FrancoisleRouxDev/SymptomJournal.git
cd SymptomJournal
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Swagger UI available at `http://localhost:8000/docs`.

### 3. Frontend (React Native / Expo)
```bash
cd frontend
npm install
npm start
```
Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

### 4. EAS Cloud Builds
```bash
# Standalone Android APK
npx eas-cli build -p android --profile preview

# iOS Simulator bundle
npx eas-cli build -p ios --profile preview-simulator
```

---

## Academic Context

| | |
|:---|:---|
| **Module** | Interactive Development 300 (DV300) — AI-Driven Application |
| **Institution** | The Open Window Institute |
| **Student** | Francois le Roux (231256) |
| **Submission** | 28 October 2026 |

---

## Acknowledgements

Tsungai Katsuro

---

<p align="center">
  <sub>Built with React Native, Expo, FastAPI, Supabase, and NVIDIA NIM. Designed for calmer health conversations.</sub>
</p>
