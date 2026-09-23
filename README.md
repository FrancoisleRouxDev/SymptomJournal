# SymptomJournal
> "Log it calmly. Understand it clearly. Talk to your doctor with confidence."

A mobile health companion that helps users log symptoms, identify patterns 
over time, and generate structured summaries for medical appointments — 
replacing the anxiety of Googling symptoms with calm, structured self-awareness.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo SDK 57) |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| AI Engine | Nvidia NIM (build.nvidia.com) / Google Gemini API |
| Deployment | Vercel (Frontend) + Railway (Backend) |
| Version Control | GitHub |

---

## Project Status
🟢 Active development — Phase 1 scaffolding complete, entering Phase 2

---

## What's Been Done

### Documentation & Design
- Project pitch document finalised (`docs/`)
- Greyscale and colour wireframes for all screens (`docs/wireframes/`)

### Frontend — React Native (Expo)
- Expo project initialised with Expo Router and TypeScript
- Tab-based navigation set up with `NativeTabs` (native) and custom web tab bar
- **Brand design system** established in `constants/theme.ts`:
  - Sage (primary) and Terracotta (accent) colour palettes
  - Light and dark theme colour maps with full token set (text, backgrounds, borders, icons)
  - Semantic colour tokens for symptom categories (pain, fatigue, mood, digestion, breathing, skin)
  - Spacing, border radius, and font-size scales
- **Custom typography** loaded via `expo-font`:
  - DM Serif Display (display headings)
  - Nunito Medium / Bold (body and UI text)
- Reusable themed components: `ThemedText`, `ThemedView`, `AnimatedSplashOverlay`
- Animated splash screen integration
- Platform-specific component variants (`.web.tsx` / `.tsx`)

### Backend — FastAPI
- Python virtual environment and `.env` configuration
- FastAPI app initialised with a base health-check route (`GET /`)

---

## Roadmap
- [ ] Phase 1 — Setup & scaffolding (Days 1–3)
- [ ] Phase 2 — Auth, onboarding, symptom logging (Days 4–7)
- [ ] Phase 3 — AI integration via FastAPI (Days 8–12)
- [ ] Phase 4 — Core features & screens (Days 13–16)
- [ ] Phase 5 — Polish & testing (Days 17–19)
- [ ] Phase 6 — Deployment (Days 20–21)

---

## Module
Interactive Development 300 — The Open Window Institute