# 🎬 SymptomJournal — Final Walkthrough Video Script
**Student:** Francois le Roux (231256)
**Module:** DV300 – Theme 4: AI-Driven Application
**Target length:** 7 minutes (fits the 5–8 minute window, with ~1 minute of slack)
**Recorded on:** Android phone (Expo SDK 58), fresh account

This script follows the path a brand-new user takes, start to finish. It was written while walking through the app as a new user on 27 October 2026, so every step, label and screen below matches what the app actually shows.

---

## ✅ Before You Hit Record (10 minutes before)

1. **Wake the backend.** Render's free tier sleeps. Open `https://symptomjournal.onrender.com/ping` in a browser about 2 minutes before recording, and again right before you start. The first request after sleeping can take 30+ seconds.
2. **Use a fresh email** you haven't registered before (a Gmail `+` alias works, e.g. `you+demo2@gmail.com`).
3. **Clear the app's data** (or reinstall) so onboarding shows from the first slide.
4. **Check the AI is on the fast model.** In the Render dashboard, `NVIDIA_MODEL` should be `nvidia/nemotron-3.5-lightning-30b-a3b` (or empty), and the latest `main` should be deployed. Then open Insights once on a test account: findings should appear within a few seconds.
6. **Turn on Do Not Disturb**, set brightness high, and enable screen recording with touches shown if your phone supports it.
7. **Have this script open on a second screen**, not on the phone you're recording.

---

## ⏱️ Timeline at a Glance

| # | Scene | Time | Running total |
|---|---|---|---|
| 1 | Intro | 0:30 | 0:30 |
| 2 | Onboarding | 0:30 | 1:00 |
| 3 | Sign up | 0:45 | 1:45 |
| 4 | Home & locked features | 0:30 | 2:15 |
| 5 | Log a symptom | 1:00 | 3:15 |
| 6 | Timeline | 0:35 | 3:50 |
| 7 | AI Insights | 0:50 | 4:40 |
| 8 | AI Medication Assistant | 0:50 | 5:30 |
| 9 | Doctor Summary & PDF | 0:45 | 6:15 |
| 10 | Profile & session | 0:25 | 6:40 |
| 11 | Under the hood & outro | 0:20 | 7:00 |

---

## 🎙️ Scene-by-Scene Script

### 1. Intro (0:00 – 0:30)
* **On screen:** Your face or the phone's home screen with the SymptomJournal icon.
* **Say:**
  > *"Hi, I'm Francois, and this is SymptomJournal — a mobile health journal that helps people track how their body feels, spot patterns with AI, and walk into a doctor's appointment with a clear summary instead of trying to remember everything on the spot. I'll walk through it exactly as a brand-new user would, from first launch to exporting a report."*

### 2. Onboarding (0:30 – 1:00)
* **Do:** Open the app. Pause on each slide for a moment, tapping **Continue** twice, then stop on the third slide.
  * Slide 1 — *Track What Your Body Says*
  * Slide 2 — *Spot Patterns Before They Worsen*
  * Slide 3 — *Share Clearly With Your Doctor*
* **Say:**
  > *"The first launch opens with a three-slide onboarding tour. Each slide maps to one of the app's three core jobs: logging symptoms quickly, surfacing patterns with AI, and sharing a clean summary with your doctor."*
* **Do:** Tap **Get Started**.

### 3. Sign Up (1:00 – 1:45)
* **Do — Step 1 of 2 (Account details):** Enter a **Full Name**, **Email** and **Password** (6+ characters). Tap **Continue**.
* **Say:**
  > *"Sign-up is split into two short steps so it never feels like a long form. Step one is the account itself — authentication runs through Supabase Auth."*
* **Do — Step 2 of 2 (About you):** Type a **Date of Birth** as `YYYY-MM-DD`, pick a **Biological Sex**, and tap one or two **Health Goals**. All three start blank and are optional. Tap **Create Account**.
* **Say:**
  > *"Step two is about the person — date of birth, and what they want to get out of the app. Then I'm signed in and taken straight to my dashboard."*

### 4. Home & Locked Features (1:45 – 2:15)
* **Do:** Let Home load. Point out the greeting with your name, the wellness card, and the empty **Recent Symptoms** card. Then quickly tap **Insights** and show the **AI Insights Locked** card, then go back to **Home**.
* **Say:**
  > *"Home greets me by name and shows my wellness card and recent symptoms — both empty for now, because I'm a new user; today's score appears as soon as I log something. The AI features are locked until I've logged three symptoms: the app tells me exactly that, with a progress bar showing 0 of 3. That's deliberate — AI patterns from one data point would be meaningless."*

### 5. Log a Symptom (2:15 – 3:15)
* **Do:** Tap **+ Log a Symptom**. Fill it in while you talk:
  * **Category:** Pain (it's preselected) — mention you can pick several
  * **Body Area:** Head — optionally show **Specific Area...** for a precise location
  * **Severity:** tap **7** (or drag along the bar)
  * **When did it start?** tap **1h ago**
  * **Potential Triggers:** **Stress** and **Screen Time**
  * **Notes:** *"Throbbing pain behind my eyes"* — point out the **0/50** counter under the box
* **Say:**
  > *"Logging is built to take seconds. I pick one or more categories, the body area, and severity on a one-to-ten scale. I can say when it started — here, an hour ago — and the app records that actual start time, not just when I tapped save. Then any triggers I suspect, and a short note — the counter shows how much room I have left."*
* **Do:** Tap **Log Symptom**. The button turns into **Symptom Logged!** and the app moves to the Timeline.
* **Jump cut:** Before the next scene, log two more symptoms off camera so the AI unlocks. What was used in testing:
  * **Fatigue · General · 5 · 3h ago · Poor Sleep, Caffeine** — *"Drained all morning, slept 5 hours"*
  * **Digestion · Abdomen · 4 · now · Diet / Food** — *"Bloated after a heavy lunch"*
* **Say (after the cut):**
  > *"I've logged a couple more entries so we have enough data for the AI."*

### 6. Timeline (3:15 – 3:50)
* **Do:** On **Timeline**, show the calendar dot on today's date, the **TODAY** group, and one entry card (time, severity, trigger chips, note). Tap the **Pain** filter chip, then **All**. Tap today's date on the calendar to filter, then tap it again to clear.
* **Say:**
  > *"The timeline groups everything by day. The entry I logged as 'an hour ago' shows exactly that time. Each card shows severity, triggers and my note, and I can filter by category or tap any day on the calendar to see just that day."*

### 7. AI Insights (3:50 – 4:40)
* **Do:** Tap **Insights**. Show the skeleton loading state, then the **Weekly Overview** chart, **Most Frequent** and **Avg Severity** cards, and scroll through **Key Findings**.
* **Say:**
  > *"Now that I have three entries, Insights unlocks. The app sends my recent logs to our FastAPI backend on Render, which calls a large language model on NVIDIA NIM to look for patterns — timing, triggers, and trends. The prompt has strict guardrails: no diagnoses, no medication advice, no alarming language, and always a nudge to talk to a doctor. The numbers like average severity are calculated directly from my data, never by the AI, so they can't be made up."*
* **Do (optional):** Tap **Recalculate AI Findings**.

### 8. AI Medication Assistant (4:40 – 5:30)
* **Do:** Tap the orange **AI Rx** button. Tap **Got It, Continue** on the connection notice. Show the status pill in the top right. Tap the quick prompt **Common side effects of Ibuprofen?** or type *"Can I take ibuprofen on an empty stomach?"* and send.
* **Say:**
  > *"The AI Rx button opens a medication assistant. You can tap one of the quick questions or type your own. It gives factual, plain-language answers and always reminds you to confirm with a doctor or pharmacist. If someone describes an emergency, it gives South African emergency numbers first — 10177, 112, the SADAG and Poison Information lines — as well as international ones. And if there's no connection, the assistant falls back to built-in safe guidance for common medicines like ibuprofen and paracetamol, so it never just fails."*

### 9. Doctor Summary & PDF Export (5:30 – 6:15)
* **Do:** Tap **Summary**. Show the **Patient Report** card (name, date range, entries, symptom types, average severity), **Most Frequent Symptoms** bars, **Patterns & Notes**, and **Questions to Discuss with Doctor**. Tap **Export PDF** and show the share sheet / PDF preview.
* **Say:**
  > *"This is the feature the whole app builds toward. The Doctor Summary turns my logs into a clinic-ready report: how long I've tracked, how often each symptom happens, average severity, the patterns the AI found, and questions to raise with my doctor. One tap exports it as a PDF I can share or print before an appointment."*

### 10. Profile & Session (6:15 – 6:40)
* **Do:** Tap **Profile**. Show your name and email, **Clinical & Health Info**, the entry stats and **Achievements**. Then close the app completely (swipe it away) and reopen it — it should go straight to Home.
* **Say:**
  > *"Profile holds my details, my doctor and tracked conditions, and some achievements to encourage consistent logging. And if I close the app completely and reopen it, I'm still signed in — the session is saved on the device and refreshed automatically."*

### 11. Under the Hood & Outro (6:40 – 7:00)
* **On screen:** Stay on Home, or cut to a slide with the architecture.
* **Say:**
  > *"Under the hood, it's an Expo React Native app on SDK 58, Supabase for authentication and the Postgres database with row-level security, and a Python FastAPI backend on Render that verifies every request's login token, rate-limits traffic, and talks to NVIDIA's AI models. Thanks for watching — this has been SymptomJournal."*

---

## 🛠️ Issues Found During the Walkthrough (27 Oct 2026)

All of these were found while walking through the app as a new user, and are fixed in the code.

| Issue found | Fix |
|---|---|
| AI answers took 1–3 minutes (`meta/llama-3.2-11b-vision-instruct`), so Insights and AI Rx fell back to sample content | Default model is now `nvidia/nemotron-3.5-lightning-30b-a3b` with reasoning switched off (patterns ~3s, chat ~3s, doctor summary ~13s). AI calls give up after 20s with one retry |
| One slow AI request froze the whole backend | Endpoints now run in worker threads, so other screens keep loading |
| Tapping **AI Rx** bounced back to Home (Expo SDK 58 change) | Medication screen is hidden from the tab bar in a way that keeps it reachable |
| Notes over 50 characters failed with a raw database error | Notes box stops at 50 characters and shows a live **x/50** counter |
| New users saw a made-up wellness score (95, "▲ 8 pts from yesterday") and a 1-day streak | Score uses today's logs only (shows "—" until you log), the trend compares with yesterday's real score, and the streak counts consecutive days |
| Insights fallback showed invented findings ("82% more often…") | Fallback findings are counted from your own logs and labelled as such |
| Sign-up pre-filled a 1994 birth date and "Female"; sex and goals were never saved | Step 2 starts blank, the date is validated, and sex and goals are saved to the profile |
| Welcome notifications failed to save (live table has no `title`/`message` columns) | Notification text now comes from the notification type |
| Calendar days sat under the wrong weekday | Every day sits in its correct weekday column |

**Still needed before recording:** deploy the latest `main` to Render, and set `NVIDIA_MODEL` in the Render dashboard to `nvidia/nemotron-3.5-lightning-30b-a3b` (or delete it so the new default is used).
