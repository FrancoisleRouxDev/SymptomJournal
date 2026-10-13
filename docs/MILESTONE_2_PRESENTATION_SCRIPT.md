# 🎙️ SymptomJournal — Milestone 2 Presentation Script & Quick Reference
**Student:** Francois le Roux (231256)  
**Module:** DV300 – Theme 4: AI-Driven Application  
**Check Date:** Wednesday, 14 October 2026  
**Final Hand-in Date:** 28 October 2026  

---

## ⏱️ Part 1: The 60-Second Opening Pitch (Memorize This)

> *"Good morning / afternoon! Today I'm presenting **SymptomJournal** — a mobile health companion designed to replace the anxiety of Googling medical symptoms with calm, structured self-awareness."*
>
> *"For Milestone 2, our agreed baseline was core navigation and an initial AI proof-of-concept. I'm pleased to report that we are **fully ahead of schedule**: all 6 MVP core features are built, integrated with a live PostgreSQL database on Supabase and a cloud-hosted FastAPI backend on Render, and compiled into a signed, installable Android APK with automated test suites on both frontend and backend."*

---

## 📱 Part 2: Step-by-Step Live Demo Flow (3–4 Minutes)

Follow this exact sequence on your phone or emulator while speaking:

```
[Onboarding & Auth] ➡️ [Home Dashboard] ➡️ [Log Symptom] ➡️ [Timeline & History] ➡️ [AI Pattern Insights] ➡️ [Medication Assistant Chat] ➡️ [Doctor Summary & PDF] ➡️ [Session Persistence Test]
```

### 1. Launch & Authentication (30 seconds)
* **What you do:** Open the app.
* **What you say:**
  > *"When a user opens the app for the first time, they are welcomed by our brand onboarding sequence explaining privacy and purpose. Our auth system connects to Supabase with JWT token verification. We also implemented persistent sessions via AsyncStorage and AppState listeners, meaning when the app closes and reopens, the user remains securely logged in without re-authenticating."*

### 2. Home Dashboard & Quick Log (30 seconds)
* **What you do:** Tap into the **Home** tab, then tap **+ Log Symptom**.
* **What you say:**
  > *"Here is the Home screen adhering strictly to our design system: Sage Green `#3D6456` and Terracotta `#C86D51` using Google DM Serif Display for headings and Nunito for UI readability."*
  > *"Let's log a real symptom: Category: Migraine/Headache, Severity: 7/10, Triggers: Lack of sleep & screen time, Notes: Throbbing temple pain."*
* **What you do:** Hit Save. Show instant optimistic update or success feedback.

### 3. Timeline & Supabase Persistence (20 seconds)
* **What you do:** Switch to the **Timeline** tab.
* **What you say:**
  > *"Every entry is immediately persisted to our Supabase PostgreSQL database with Row-Level Security. In the Timeline, users can filter by date ranges and symptom severity categories."*

### 4. AI Pattern Analysis (Core AI - 45 seconds)
* **What you do:** Switch to the **Insights** tab. Notice the shimmer skeleton loaders while data loads.
* **What you say:**
  > *"Now for the core AI integration. The frontend makes an authenticated POST request to our FastAPI backend deployed on Render, which securely calls NVIDIA NIM running Llama 3.3 70B Instruct."*
  > *"Notice the shimmer skeleton loaders — during the 2–3 second AI inference, the user has visual feedback rather than an unresponsive spinner. The AI detects temporal correlations, potential triggers, and lifestyle patterns without making alarming diagnoses."*

### 5. AI Medication Assistant (Interactive AI - 30 seconds)
* **What you do:** Tap the floating pill icon / **Medication Assistant** tab. Type: *"Can I take Ibuprofen on an empty stomach?"*
* **What you say:**
  > *"In addition to batch analysis, we provide a conversational AI assistant specifically for safe over-the-counter medication awareness. It uses strict system prompt guardrails: it provides factual information, warns of interactions, and explicitly reminds the user to verify with their pharmacist."*

### 6. Doctor Summary & Native PDF Export (30 seconds)
* **What you do:** Tap **Doctor Summary** and tap **Export PDF / Share**.
* **What you say:**
  > *"One of our primary pitch promises was helping users speak to their doctor with confidence. Our backend structures logged data into a clinical SBAR-style briefing (Situation, Background, Assessment, Recommendation), which our native Expo Print service compiles into a professional, shareable clinical PDF report ready for appointments."*

### 7. App Closure & Session Re-check (15 seconds)
* **What you do:** Swipe the app away to close it completely. Reopen it.
* **What you say:**
  > *"Finally, if I kill the app and reopen it, notice it bypasses onboarding and sign-in, instantly restoring the active session. The user is right back where they left off."*

---

## 📋 Part 3: Answering the 13 Lecturer Criteria

Have these 1-sentence answers ready if the lecturer looks at a specific line on the rubric:

| # | Area (Weight) | What to Say / Point To |
|---|---------------|-------------------------|
| **1** | **Project Management (5%)** | *"67 meaningful git commits following conventional commits (`feat:`, `fix:`, `test:`, `docs:`), clean branch integration, and an up-to-date roadmap in README.md."* |
| **2** | **Scope Confirmation (5%)** | *"All 6 pitch must-haves are locked and 100% completed: Auth, Symptom Logging, Timeline History, AI Pattern Detection, Doctor Summary PDF, and Medication Chatbot."* |
| **3** | **UI Design (10%)** | *"Both greyscale and colour wireframes for all 10 screens are organized in `docs/wireframes/`, implemented cleanly in React Native using our theme tokens (`constants/theme.ts`)."* |
| **4** | **Frontend Build (15%)** | *"Built with React Native on Expo SDK 57 and Expo Router. All 7 tabs (Home, Log, Timeline, Insights, Summary, Medication, Profile) are fully functional and responsive."* |
| **5** | **Backend / API (10%)** | *"FastAPI backend with structured routers for `/symptoms`, `/analysis`, and `/auth`, complete with interactive Swagger documentation running live on Render."* |
| **6** | **Database (10%)** | *"Supabase PostgreSQL database implementing our ERD tables with Row-Level Security, handling authenticated CRUD operations with real user data."* |
| **7** | **Authentication & Roles (5%)** | *"Supabase Auth with JWT verification, auto-profile creation, secure sign-out, and persistent AsyncStorage sessions with AppState auto-refresh."* |
| **8** | **AI Integration (20%)** | *"Multi-modal AI: Nvidia NIM (Llama 3.3 70B Instruct). All API keys are strictly kept server-side in backend `.env` and never exposed to the client bundle."* |
| **9** | **AI Reliability (5%)** | *"Pydantic input validation, structured markdown sanitization, shimmer skeleton loaders during generation, and fallback structured summaries if the LLM is unreachable."* |
| **10** | **Testing (5%)** | *"54 passing frontend Jest tests (94.6% coverage), 40 passing backend pytest tests (77% coverage), plus a live automated end-to-end healthcheck script (`e2e_healthcheck.py`)."* |
| **11** | **Risks & Challenges (5%)** | *"Render free-tier cold starts are mitigated by upfront loading feedback; AI non-determinism is controlled with structured system prompts; APK size constraints were solved via GitHub Releases."* |
| **12** | **Plan for Weeks 3–4 (5%)** | *"Because core MVP features are already finished ahead of schedule, Weeks 3 and 4 will focus on user testing sessions, usability feedback refinement, and final UI micro-polish."* |
| **13** | **Deployment (Stretch)** | *"Backend is live at `https://symptomjournal.onrender.com`, and APK release v1.0.0 is downloadable directly from our public GitHub Releases page."* |

---

## 💻 Part 4: Terminal Commands Cheat Sheet (If Lecturer Asks to See Proof)

Keep a terminal open in the background with these commands ready to run:

### 1. Run Frontend Tests (54 tests, ~3 seconds)
```powershell
cd frontend
npm test
```
*Expected result:* `PASS` on 7 suites, 54 tests passing.

### 2. Run Backend Tests & Coverage (40 tests, ~2 seconds)
```powershell
cd backend
.\.venv\Scripts\pytest --cov=routers --cov=services
```
*Expected result:* 40 passed, 77% test coverage.

### 3. Run Live End-to-End System Healthcheck
```powershell
cd backend
python tests/e2e_healthcheck.py
```
*Expected result:* Checks Supabase DB, FastAPI, and NVIDIA AI live in real-time.

### 4. Show Git Commit History & Branch Cleanliness
```powershell
git log --oneline -10
git status
```

---

## 🛡️ Part 5: Tough Questions & Bulletproof Answers

#### Q: *"Why does the first AI request take a few extra seconds?"*
> **Answer:** *"The backend is hosted on Render's free tier, which enters a cold-start sleep state after 15 minutes of inactivity. To ensure the user is never left looking at a frozen screen, we built animated shimmer skeleton loaders that clearly indicate data fetching in progress."*

#### Q: *"Why aren't the .apk binary files committed directly into Git?"*
> **Answer:** *"The compiled release APK is ~108MB, which exceeds GitHub's 100MB per-file Git limit. Committing large binaries bloats repository clone times and violates Git best practices. Following industry standards, we host the installable APK via official GitHub Releases and provide the direct download link in the project README."*

#### Q: *"How do you prevent the AI from giving dangerous medical diagnoses?"*
> **Answer:** *"We use three levels of defense: First, our system prompt strictly instructs the model to act as an observational pattern correlator, not a diagnostician. Second, every AI response includes an un-dismissible clinical disclaimer. Third, the doctor summary feature is specifically designed to bridge the user to a real healthcare professional."*

#### Q: *"What are your plans for Weeks 3 and 4 before final submission?"*
> **Answer:** *"Since our engineering and MVP scope are ahead of schedule, we have allocated Weeks 3 and 4 entirely to qualitative user testing with 3 to 5 real test users, collecting feedback on the logging friction and readability of the PDF export, and implementing small ergonomic refinements."*

---

## 🏆 Presentation Quick Cheat Sheet (Fold & Keep on Desk)
1. **GitHub Link:** [https://github.com/FrancoisleRouxDev/SymptomJournal](https://github.com/FrancoisleRouxDev/SymptomJournal)
2. **API Docs (Swagger):** [https://symptomjournal.onrender.com/docs](https://symptomjournal.onrender.com/docs)
3. **APK Release:** [https://github.com/FrancoisleRouxDev/SymptomJournal/releases/tag/v1.0.0](https://github.com/FrancoisleRouxDev/SymptomJournal/releases/tag/v1.0.0)
4. **Key Metrics to Quote:** 67 commits | 94 tests total (54 frontend + 40 backend) | 7 navigable tabs | 100% MVP complete.
