# ARGUS — Autonomous Cyber Defense Intelligence Platform

> *Named after Argus Panoptes — the hundred-eyed Greek titan who never sleeps.*

ARGUS is a full-stack AI-powered Security Operations Center (SOC) dashboard built for university and enterprise environments. It monitors threats in real time, analyzes phishing with large language models, scores identity trust using behavioral signals, visualizes attack chains as interactive node graphs, audits cloud infrastructure compliance, and drives autonomous incident response — all from a single dark-mode intelligence console.

---

## Overview

![Overview Module](screenshots/Overview.png)

The Overview module is the command center — featuring a featured threat actor spotlight (ShinyHunters, APT29, Lazarus Group), live system counters, the ARGUS AI Core radial visualization, an active incident feed, and an attack kill chain strip showing the current stage of an in-progress intrusion.

---

## Modules

### SENTINEL — Threat Event Feed

![Sentinel Module](screenshots/Sentinel.png)

Real-time SIEM-style threat monitoring. Displays a filterable event table with timestamps, source IPs, severity badges, and risk score bars. Selecting any event opens a right-side detail panel with an activity sparkline, source intelligence breakdown, behavioral indicators, and ANALYZE / INVESTIGATE actions.

---

### VEIL — Phishing Cognition Engine

![Veil Module](screenshots/Veil.png)

AI-powered phishing email analysis. Paste any suspicious email, SMS, or URL — ARGUS runs it through a 7-stage detection pipeline powered by Qwen3.6-35B-A3B (via Featherless). Returns a 0–100 phish risk score, attack classification, psychological manipulation vectors, and one-click response action buttons (quarantine, block sender, track agent, etc.).

---

### IDENTITY — Trust & Behavior

![Identity Module](screenshots/Identity.png)

Zero-trust behavioral scoring for active user sessions. Shows a live table of institutional personas with per-row trust bars and status badges (BLOCKED / REVOKE / MONITOR / REVIEW). Clicking a user shows a trust score ring, a declining trust timeline chart, active session IPs, behavioral indicators, and operator action buttons.

---

### ORACLE — Attack Correlation

![Oracle Module](screenshots/Oracle.png)

Multi-source attack chain correlation powered by NVIDIA Nemotron 49B. Renders an interactive SVG node graph showing the full attack path (Phish Email → Credential Harvest → Session Hijack → Lateral Movement → Data Exfiltration → Containment) with animated edge particles. The right panel shows the AI-generated incident narrative and correlated detection events from all modules.

---

### RESPONSE — Containment

![Response Module](screenshots/Response.png)

Autonomous incident response orchestration. Features a clickable stage pipeline (DETECT → TRIAGE → ISOLATE → ERADICATE → RECOVER → REVIEW), an active response actions table with live status badges, and a real-time terminal-style playbook execution log that streams as actions complete. Operator quick actions on the right (Pause All, Regenerate Plan, Investigate).

---

### SKYNET — Cloud Posture

![Skynet Module](screenshots/Skynet.png)

Cloud Security Posture Management (CSPM). Displays a circular compliance score gauge (SVG), severity breakdown stats, cloud inventory across AWS / GCP / Azure, and a full findings table with priority bars, service, finding, description, status badge, and CIS benchmark control mapping.

---

### THREAT INTEL — Intelligence Feed

![Threat Intel Module](screenshots/Threat%20Intel.png)

Aggregated threat intelligence feed with filter tabs (ALL / THREATS / INTELLIGENCE / NATION-STATE / CRIME / CVE). Live RSS from BleepingComputer, Krebs on Security, SecurityWeek, and HackerNews. Right panel shows a featured threat actor profile (ShinyHunters / APT29 / Lazarus Group) with TTPs, targets, campaign history, and days since last campaign.

---

## Tech Stack

### Backend
- **Python 3.11** / **FastAPI** — async routes throughout
- **Multi-provider AI router** — Featherless (primary) + NVIDIA NIM (secondary)
  - VEIL: `Qwen/Qwen3.6-35B-A3B`
  - ORACLE: `nvidia/llama-3.3-nemotron-super-49b-v1`
  - RESPONSE: `fdtn-ai/Foundation-Sec-8B-Reasoning`
- **psutil** — real CPU, memory, process, and network telemetry
- **feedparser** — live RSS ingestion from security news sources
- **httpx** — async HTTP for CISA KEV, CVE feeds, ip-api geolocation
- **Poetry** — dependency management
- **Pydantic v2** — settings and request/response validation

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** — custom ARGUS tactical design tokens (`#00D1FF` cyan, `#FF3B5C` red)
- **Framer Motion** — animated transitions, node graph particles, trust ring reveals
- **Lucide React** — icons
- **Web Audio API** — programmatic sound engine (no external library)
- **SVG** — custom sparklines, trust rings, compliance gauges, node graphs

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Rajbharti06/ARGUS.git
cd ARGUS
```

### 2. Backend

```bash
cd backend
poetry install
```

Copy the example env file and add your API keys:

```bash
cp .env.example .env
```

```env
# Required — get a free key at featherless.ai
FEATHERLESS_API_KEY=your_featherless_key

# Optional — for ORACLE high-quality narratives
NVIDIA_API_KEY=your_nvidia_key
```

Start the backend:

```bash
poetry run uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. Vite proxies `/api/*` to the FastAPI backend automatically.

---

## API Reference

All ARGUS module endpoints are prefixed with `/api/argus`.

| Method | Endpoint | Module | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/argus/sentinel/events` | SENTINEL | Live threat event feed (9 events with severity, IPs, timestamps) |
| `GET` | `/api/argus/sentinel/stats` | SENTINEL | System metrics (threats blocked, risk score, uptime) |
| `POST` | `/api/argus/veil/analyze` | VEIL | AI phishing analysis — returns risk score, indicators, narrative |
| `POST` | `/api/argus/identity/score` | IDENTITY | Zero-trust session scoring (0–100) from behavioral signals |
| `GET` | `/api/argus/oracle/timeline` | ORACLE | AI-correlated attack timeline + narrative (90s TTL cached) |
| `GET` | `/api/argus/skynet/scan` | SKYNET | Cloud findings + compliance score |
| `POST` | `/api/argus/response/recommend` | RESPONSE | AI incident response playbook by severity and event type |

Intelligence data endpoints (no AI, real telemetry):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/intelligence/system` | Real CPU, memory, processes via psutil |
| `GET` | `/api/intelligence/network` | Active TCP connections with risk scoring |
| `GET` | `/api/intelligence/news` | Live RSS from security news sources |
| `GET` | `/api/intelligence/threats` | CVEs from circl.lu + threat actor database |
| `GET` | `/api/intelligence/cisa-kev` | CISA Known Exploited Vulnerabilities catalog |

---

## Project Structure

```
ARGUS/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic settings, API keys, model routing
│   │   │   └── logging.py
│   │   ├── routes/
│   │   │   ├── argus.py           # All 7 module endpoints
│   │   │   └── intelligence.py   # Real telemetry endpoints
│   │   ├── services/
│   │   │   └── ai_router.py       # Multi-provider LLM router with fallbacks
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── OverviewModule.jsx      # Command center dashboard
│   │   │   ├── SentinelModule.jsx      # SIEM table + event detail
│   │   │   ├── VeilModule.jsx          # Phishing AI analysis
│   │   │   ├── IdentityModule.jsx      # Zero-trust session scoring
│   │   │   ├── OracleModule.jsx        # Attack correlation node graph
│   │   │   ├── SkynetModule.jsx        # Cloud posture + compliance
│   │   │   ├── ResponseModule.jsx      # Incident response pipeline
│   │   │   ├── ThreatIntelModule.jsx   # Intelligence feed + threat actors
│   │   │   └── ui/                    # Shared components (ArgusCore, feeds, panels)
│   │   ├── utils/
│   │   │   ├── cn.js                  # Tailwind class merging
│   │   │   └── sound.js               # Web Audio engine
│   │   ├── App.jsx                    # Shell, sidebar nav, module routing
│   │   └── index.css                  # ARGUS design system + animations
│   ├── tailwind.config.js
│   └── vite.config.ts
└── screenshots/                       # Module reference screenshots
```

---

## AI Provider Setup

ARGUS uses a multi-provider AI router with automatic fallbacks:

```
VEIL:     Featherless (Qwen3.6-35B-A3B) → NVIDIA fallback
ORACLE:   NVIDIA Nemotron 49B → Featherless (Kimi-K2.6) fallback
RESPONSE: Featherless (Foundation-Sec-8B-Reasoning)
FAST:     Featherless (GLM-5.1)
FALLBACK: Featherless (Llama-3.1-8B-Instruct)
```

**Featherless** (recommended) — free tier available, runs 500+ open-source models via OpenAI-compatible API. Get a key at [featherless.ai](https://featherless.ai).

**NVIDIA NIM** — high-quality inference for Nemotron, Llama, and Mistral models. Get a key at [build.nvidia.com](https://build.nvidia.com).

---

## Demo Flow

1. Open `http://localhost:5173`
2. **OVERVIEW** — watch live threat counters tick up; ShinyHunters card shows 47 days since last campaign
3. **SENTINEL** — filter by severity; click any event to see sparkline + source intelligence
4. **VEIL** — click "IT Security Alert" sample, hit **Initiate Analysis** — watch the 7-stage detection pipeline complete
5. **IDENTITY** — click "Dr. J. Lee" (trust score 14) to see the declining trust timeline and blocked session list
6. **ORACLE** — click **Execute Correlation** — watch the attack node graph animate + AI narrative generate
7. **RESPONSE** — click **Run Playbook** — watch the terminal log stream as containment actions execute
8. **SKYNET** — view the 62/100 compliance gauge and 8 cloud findings with CIS benchmark mappings
9. **THREAT INTEL** — browse live security news; click ShinyHunters to see full threat actor profile

---

## License

MIT
