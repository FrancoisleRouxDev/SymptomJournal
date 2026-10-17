# SymptomJournal 🌿 – User Journey & Patient Experience Map

> *"From uncertainty to clarity: how patients navigate symptoms, uncover AI-driven insights, and communicate effectively with their healthcare providers."*

---

## 🗺️ Executive Summary: The Patient Lifecycle

Living with chronic, fluctuating, or mysterious symptoms often leads to anxiety, forgotten details during short 15-minute clinical appointments, and unhelpful internet searches. **SymptomJournal** bridges the gap between daily lived experience and clinical consultations through an intentional 6-stage user journey:

<p align="center">
  <img src="images/user_journey_flow.png" alt="SymptomJournal Patient User Journey & Screen Flow" width="100%" />
</p>

```mermaid
journey
    title Patient Journey Through SymptomJournal
    section 1. Onboarding
      Discover app & calming philosophy: 5: Patient
      View 3-step value tour: 5: Patient
      Create account & select health goals: 4: Patient
    section 2. Daily Logging
      Notice physical / emotional discomfort: 2: Patient
      Open app & tap '+' button: 5: Patient
      Select category & severity (1-10): 5: Patient
      Tag body location & environmental triggers: 5: Patient
      Save entry in under 15 seconds: 5: Patient
    section 3. History & Review
      Inspect interactive calendar with dot indicators: 4: Patient
      Filter timeline by symptom category: 5: Patient
      Review chronological severity progressions: 4: Patient
    section 4. AI Pattern Discovery
      Surpass 3-log minimum milestone: 5: Patient
      Unlock AI Insights tab: 5: Patient
      Explore Pain vs. Fatigue weekly charts: 5: Patient
      Review plain-language temporal correlations: 5: Patient
    section 5. Clinical Prep & Export
      Prepare for upcoming doctor appointment: 3: Patient
      Generate SBAR Clinical Summary: 5: Patient
      Review AI-generated appointment discussion points: 5: Patient
      Export & share publication-grade PDF: 5: Patient
    section 6. On-Demand Health AI
      Question OTC medication dosage or side effects: 3: Patient
      Chat with AI Medication Assistant: 5: Patient
      Receive safe, non-diagnostic guidance: 5: Patient
```

---

## 🔄 Detailed Step-by-Step User Flow

```mermaid
flowchart TD
    Start([Launch App]) --> AuthCheck{Active Session?}

    %% Branch 1: Onboarding & Auth
    AuthCheck -- No --> HasOnboarded{Completed Onboarding?}
    HasOnboarded -- No --> Slide1[Slide 1: Track What Your Body Says]
    Slide1 --> Slide2[Slide 2: Spot Patterns Before They Worsen]
    Slide2 --> Slide3[Slide 3: Share Clearly With Your Doctor]
    Slide3 --> SignUpChoice{Action}
    SignUpChoice -- Get Started --> SignUp[Sign Up Screen: Email, Password, Name]
    SignUpChoice -- Existing Account --> SignIn[Sign In Screen: Email, Password]
    HasOnboarded -- Yes --> SignIn

    SignUp --> ProfileSetup[Step 2: DOB, Biological Sex & Health Goals]
    ProfileSetup --> HomeDashboard
    SignIn --> AuthSuccess{Valid Credentials?}
    AuthSuccess -- Yes --> HomeDashboard
    AuthSuccess -- No --> ShowAuthError[Display Alert & Retry]
    ShowAuthError --> SignIn

    %% Branch 2: Core Experience (Home Dashboard)
    AuthCheck -- Yes --> HomeDashboard[Home Dashboard: Today's Wellness Score, Quick Stats, Recent Feed]

    HomeDashboard -->|Tap '+'| LogScreen[Symptom Logger]
    HomeDashboard -->|Tap Timeline| TimelineScreen[Chronological Timeline]
    HomeDashboard -->|Tap Insights| InsightsScreen[AI Pattern Insights]
    HomeDashboard -->|Tap Summary| SummaryScreen[Clinical Doctor Summary]
    HomeDashboard -->|Floating AI Rx| ChatScreen[Medication & Health Assistant]
    HomeDashboard -->|Tap Profile| ProfileScreen[Profile, Achievements & Settings]

    %% Symptom Logging Flow
    subgraph LoggingFlow [Rapid 15-Second Logging Flow]
        LogScreen --> SelectCategory[1. Select Primary Category\nPain, Fatigue, Mood, Digestion, Breathing, Skin]
        SelectCategory --> SetSeverity[2. Set Severity 1-10 Slider\nMild, Moderate, Severe color cues]
        SetSeverity --> SetOnset[3. Select Onset Time\nNow, 1h ago, 3h ago, Earlier]
        SetOnset --> SelectBodyArea[4. Anatomical Region Mapping\nHead, Neck, Chest, Abdomen, Back, etc.]
        SelectBodyArea --> SelectTriggers[5. Tag Lifestyle Triggers\nPoor Sleep, Dehydration, Stress, Coffee, etc.]
        SelectTriggers --> AddNotes[6. Optional Descriptive Notes]
        AddNotes --> SaveLog[Tap 'Save Symptom Entry']
        SaveLog --> PersistDB[(Save to Supabase PostgreSQL)]
        PersistDB --> UpdateWellness[Update Wellness Score & Day Streak]
        UpdateWellness --> BackToHome[Return to Home Dashboard]
    end

    %% AI Insights Flow
    subgraph InsightsFlow [AI Pattern Discovery Engine]
        InsightsScreen --> CheckCount{Total Logs >= 3?}
        CheckCount -- No --> LockedState[Shimmer Lock Card: Log 3 entries to unlock AI]
        CheckCount -- Yes --> TriggerAI[FastAPI /analysis Endpoint]
        TriggerAI --> NIMLLM[NVIDIA NIM Llama 3.3 70B]
        NIMLLM --> ParseJSON[Strip Fences & Validate JSON]
        ParseJSON --> DisplayInsights[Render Dual-Series Bar Chart\nPain vs. Fatigue, Key Findings & Recommendations]
    end

    %% Clinical Summary Flow
    subgraph SummaryFlow [Doctor SBAR Summary & PDF Export]
        SummaryScreen --> FetchSBAR[FastAPI /analysis/doctor-summary]
        FetchSBAR --> RenderSBAR[Render SBAR Structure:\n• Situation & Background\n• Assessment & Severity Frequency\n• Recommendation & Questions to Discuss]
        RenderSBAR --> TapExport[Tap 'Export PDF Report']
        TapExport --> GenHTML[Generate Clinical Print HTML with Brand CSS]
        GenHTML --> ExpoPrint[expo-print / expo-sharing]
        ExpoPrint --> ShareDialog[Native System Share Sheet / Save to Files]
    end

    %% AI Medication Chat Flow
    subgraph ChatFlow [AI Health & Medication Assistant]
        ChatScreen --> ShowPrompts[Display Quick-Question Chips]
        ShowPrompts --> UserQuery[User Enters Question or Taps Chip]
        UserQuery --> GuardrailCheck[FastAPI /chat Safety Prompt]
        GuardrailCheck --> LLMStream[NVIDIA NIM Inference]
        LLMStream --> DisplayBubble[Render Sage Message Bubble with Medical Disclaimer]
    end
```

---

## 👥 Personas & Clinical Use Cases

### Persona 1: Sarah – Chronic Migraine Tracker
* **Background:** 28-year-old software designer experiencing recurring tension headaches and brain fog.
* **Core Pain Point:** In consultations, she forgets whether headaches happen before or after poor sleep.
* **SymptomJournal Journey:**
  1. Sarah logs each headache in 15 seconds from her phone's home screen.
  2. She tags triggers: *"Screen Glare"* and *"Poor Sleep"*.
  3. After 10 entries, the **AI Insights Engine** highlights: *"Headaches occur 85% more often following fewer than 5 hours of sleep."*
  4. Before her neurology visit, she taps **Export PDF** to hand her doctor a clean, 1-page SBAR clinical summary.

### Persona 2: Marcus – Adult Asthma & Breathing Flare-ups
* **Background:** 42-year-old runner diagnosed with adult-onset asthma.
* **Core Pain Point:** Needs to know if cold weather or pollen causes his chest tightness.
* **SymptomJournal Journey:**
  1. Marcus creates custom triggers: *"Cold Weather"* and *"High Pollen"*.
  2. Uses the **Medication Assistant** to ask *"Can I use my albuterol inhaler 15 minutes before running?"*
  3. Receives clear, safe non-diagnostic guidance reinforcing his prescription instructions.
  4. Filters the **Timeline Screen** by *"Breathing"* to see month-over-month improvements.

---

## 🛡️ Clinical Safety & Ethics Framework

| Guardrail Layer | Implementation | Purpose |
|:---|:---|:---|
| **Non-Diagnostic Policy** | Embedded system prompt & UI disclaimers | Ensures patients understand the app is for observation, not emergency diagnosis. |
| **Emergency Redirection** | Regex detection for red-flag symptoms (*chest pain, severe bleeding, anaphylaxis*) | Prompts users immediately to call local emergency services (e.g., 911 / 112). |
| **Data Privacy (HIPAA / GDPR)** | Supabase Row-Level Security (RLS) & JWT authentication | Each patient can only read, write, and export their own symptom logs. |
| **Optional Clinician Details** | Profile doctor fields are non-mandatory | Supports patients without a regular primary physician or those transitioning clinics. |

---

<p align="center">
  <sub>Documented for DV300 Theme 4 (AI-Driven Application) • The Open Window Institute</sub>
</p>
