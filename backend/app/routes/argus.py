"""
ARGUS — Core Module API Routes
7 modules: Sentinel, Veil, Identity, Oracle, Skynet, Response + streaming
"""

import asyncio
import json
import random
import re
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse
import psutil
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx

from app.services.detector import analyze_email
from app.services.ai_router import AIRouter, veil_router, oracle_router, nvidia_router, best_available_router
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


def _strip_thinking(text: str) -> str:
    """Remove chain-of-thought tokens from model output before displaying."""
    text = re.sub(r"<think>.*?</think>",               "", text, flags=re.DOTALL)
    text = re.sub(r"<\|thinking\|>.*?</\|thinking\|>", "", text, flags=re.DOTALL)
    text = re.sub(r"<\|thought\|>.*?</\|thought\|>",   "", text, flags=re.DOTALL)
    return text.strip()


# ── IP & URL Intelligence Helpers ────────────────────────────────────────────

_INTERNAL_PREFIXES = ("10.", "192.168.", "127.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.30.", "172.31.")
_HIGH_RISK_COUNTRIES = {"Russia", "China", "North Korea", "Iran", "Ukraine", "Romania", "Bulgaria", "Nigeria", "Belarus"}
_SUSPICIOUS_TLDS = {".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".work", ".click", ".win", ".racing", ".stream", ".bid", ".loan"}
_URL_SHORTENERS  = {"bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "cutt.ly"}


async def _enrich_ip(ip: str) -> dict:
    """Real geolocation + proxy/hosting detection via ip-api.com (free, no auth)."""
    if ip.startswith(_INTERNAL_PREFIXES):
        return {}
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,country,countryCode,city,isp,proxy,hosting,as"}
            )
            d = r.json()
            if d.get("status") == "success":
                risk_score   = 0
                risk_factors = []
                if d.get("proxy"):
                    risk_score += 35; risk_factors.append("VPN/Proxy")
                if d.get("hosting"):
                    risk_score += 20; risk_factors.append("Cloud/VPS")
                if d.get("country") in _HIGH_RISK_COUNTRIES:
                    risk_score += 25; risk_factors.append(d["country"])
                risk_level = "CRITICAL" if risk_score >= 50 else "HIGH" if risk_score >= 35 else "MEDIUM" if risk_score >= 20 else "LOW"
                return {
                    "country":      d.get("country"),
                    "city":         d.get("city"),
                    "isp":          d.get("isp"),
                    "asn":          d.get("as"),
                    "proxy":        d.get("proxy", False),
                    "hosting":      d.get("hosting", False),
                    "risk_score":   risk_score,
                    "risk_level":   risk_level,
                    "risk_factors": risk_factors,
                }
    except Exception:
        pass
    return {}


def _extract_urls(text: str) -> list[str]:
    return re.findall(r"https?://[^\s<>\"{}|\\^`\[\]]+", text)[:4]


async def _check_url_reputation(url: str) -> dict:
    """Check URL reputation: TLD, shortener, IP geolocation + proxy/hosting detection."""
    try:
        parsed = urlparse(url)
        host   = parsed.netloc or parsed.path.split("/")[0]
        if not host:
            return {}

        tld             = "." + host.rsplit(".", 1)[-1].lower()
        is_suspicious   = tld in _SUSPICIOUS_TLDS
        is_shortened    = host.lower() in _URL_SHORTENERS

        risk_score   = 0
        risk_factors = []

        if is_suspicious:
            risk_score += 45; risk_factors.append(f"Suspicious TLD ({tld}) - common phishing domain")
        if is_shortened:
            risk_score += 35; risk_factors.append("URL shortener - destination obfuscated")

        # Check host IP reputation
        geo: dict = {}
        try:
            async with httpx.AsyncClient(timeout=3.0) as c:
                r = await c.get(
                    f"http://ip-api.com/json/{host}",
                    params={"fields": "status,country,city,isp,proxy,hosting"}
                )
                d = r.json()
                if d.get("status") == "success":
                    geo = d
                    if d.get("proxy"):
                        risk_score += 30; risk_factors.append("Hosted on proxy/VPN infrastructure")
                    if d.get("hosting"):
                        risk_score += 15; risk_factors.append("Cloud/VPS hosting (common for phishing kits)")
                    if d.get("country") in _HIGH_RISK_COUNTRIES:
                        risk_score += 20; risk_factors.append(f"Server in {d['country']}")
        except Exception:
            pass

        risk_level = "CRITICAL" if risk_score >= 60 else "HIGH" if risk_score >= 40 else "MEDIUM" if risk_score >= 20 else "LOW"

        return {
            "url":              url,
            "host":             host,
            "risk_score":       min(risk_score, 100),
            "risk_level":       risk_level,
            "risk_factors":     risk_factors,
            "is_suspicious_tld": is_suspicious,
            "is_shortened":     is_shortened,
            "geo":              {
                "country": geo.get("country"),
                "city":    geo.get("city"),
                "isp":     geo.get("isp"),
                "proxy":   geo.get("proxy", False),
                "hosting": geo.get("hosting", False),
            } if geo.get("status") == "success" else None,
        }
    except Exception as exc:
        return {"url": url, "error": str(exc)}


# ─── PROMPTS ──────────────────────────────────────────────────────────────────

_VEIL_PROMPT = """\
You are ARGUS VEIL — an elite cybersecurity AI specialized in phishing, social engineering, and credential-harvesting detection.

Analyze this message with forensic precision:
---
{content}
---

Pre-scan indicators: {rules}
Rule-based risk score: {score}/100

Instructions:
- Think like a threat analyst, not a chatbot
- Identify every social engineering vector present
- Score risk accurately — do not round to 0 or 100 without reason
- Return ONLY valid JSON, no markdown, no explanation outside JSON

{{
  "threat_level": "critical|high|medium|low",
  "risk_score": <integer 0-100>,
  "confidence": <integer 0-100>,
  "attack_classification": "<e.g. spear_phishing|credential_harvest|ceo_fraud|vishing>",
  "detected_indicators": ["<precise indicator>", "..."],
  "psychological_vectors": ["<urgency|authority|fear|scarcity|social_proof>", "..."],
  "executive_summary": "<2-3 sentence operational threat briefing — third person, intelligence tone>",
  "recommended_actions": ["<specific containment or investigation action>", "..."]
}}"""


_ORACLE_PROMPT = """\
You are ARGUS ORACLE — the threat correlation and intelligence synthesis engine.

Reconstruct the following attack chain and generate an executive threat briefing:

Timeline:
{timeline}

Attack vector: {vector}
Affected records: {records}
Dwell time: {dwell}

Write a 4-5 sentence executive briefing in third-person intelligence style.
Cover: initial access method, progression, impact scope, current containment status, and recommended strategic response.
Be precise and authoritative. Do not hedge. This briefing goes to institutional leadership."""


_RESPONSE_PROMPT = """\
You are ARGUS RESPONSE ENGINE — autonomous incident response orchestration.

Incident details:
- Severity: {severity}
- Event type: {event_type}
- Affected entity: {user}
- Timestamp: {timestamp}

Generate an immediate response playbook. For each action provide:
1. The exact action to take
2. Why it is necessary
3. Time-critical? (yes/no)

Return ONLY valid JSON:
{{
  "threat_classification": "<ransomware|credential_compromise|data_exfil|insider_threat|other>",
  "immediate_actions": [
    {{"action": "...", "reason": "...", "time_critical": true}}
  ],
  "followup_actions": [
    {{"action": "...", "reason": "...", "time_critical": false}}
  ],
  "escalation_required": <true|false>,
  "estimated_response_time": "...",
  "confidence": <integer 0-100>
}}"""


# ─── SENTINEL EVENT POOL ──────────────────────────────────────────────────────

_EVENT_POOL = [
    {"event": "brute_force",         "user": "admin",              "ip": "185.220.101.45", "country": "Russia",      "severity": "critical", "description": "5 failed SSH login attempts in 90 seconds — pattern matches automated credential stuffing toolkit"},
    {"event": "impossible_travel",   "user": "prof.johnson@univ.edu","ip": "203.45.12.88", "country": "China",       "severity": "high",     "description": "Login from Beijing — last authenticated session in Boston 2 hours ago. Velocity impossible."},
    {"event": "vpn_anomaly",         "user": "student_2841",        "ip": "45.89.106.12",  "country": "Netherlands", "severity": "medium",   "description": "Tor exit node detected — user anonymizing traffic through known anonymization infrastructure"},
    {"event": "midnight_admin",      "user": "svc_account",         "ip": "10.0.0.14",     "country": "Internal",    "severity": "high",     "description": "Admin dashboard accessed at 3:14 AM — outside provisioning window, no change ticket found"},
    {"event": "mass_download",       "user": "research_admin",      "ip": "192.168.1.200", "country": "Internal",    "severity": "medium",   "description": "1,247 research files downloaded in 6 minutes — 40x baseline download rate"},
    {"event": "credential_stuffing", "user": "multiple_accounts",   "ip": "94.102.49.190", "country": "Ukraine",     "severity": "critical", "description": "Credential stuffing — 847 attempts in 4 minutes, 12 successful authentications"},
    {"event": "api_key_leak",        "user": "devops_team",         "ip": "142.250.80.46", "country": "USA",         "severity": "high",     "description": "AWS API key with full S3 permissions committed to public GitHub repository 14 days ago — key still active"},
    {"event": "lateral_movement",    "user": "host_10.0.4.23",      "ip": "10.0.4.23",     "country": "Internal",    "severity": "critical", "description": "Lateral movement across internal subnet — 6 hosts contacted via SMB in 3 minutes. Ransomware precursor pattern."},
    {"event": "data_exfiltration",   "user": "unknown",             "ip": "185.220.101.14","country": "Romania",     "severity": "critical", "description": "2.4 GB transferred to unknown external endpoint via HTTPS port 443 — domain registered 48 hours ago"},
    {"event": "phishing_campaign",   "user": "mail_gateway",        "ip": "52.44.12.8",    "country": "USA",         "severity": "high",     "description": "Targeted spear-phishing campaign — 312 emails intercepted, spoofing VP of Finance domain"},
    {"event": "dns_tunneling",       "user": "workstation_084",     "ip": "10.1.2.84",     "country": "Internal",    "severity": "medium",   "description": "DNS tunneling pattern detected — high-frequency TXT record queries consistent with C2 beaconing"},
    {"event": "new_admin_account",   "user": "unknown_svc",         "ip": "10.0.0.99",     "country": "Internal",    "severity": "high",     "description": "Privileged account created outside change management window — no corresponding service request"},
    {"event": "ransomware_behavior", "user": "faculty_device_101",  "ip": "192.168.5.101", "country": "Internal",    "severity": "critical", "description": "Mass file encryption behavior — 2,847 files affected in 90 seconds. Shadow copies deleted. Ransomware confirmed."},
    {"event": "token_replay",        "user": "student_admin",       "ip": "77.88.21.3",    "country": "Russia",      "severity": "critical", "description": "Session token replay detected — valid token used from 2 geographically separate IPs simultaneously"},
    {"event": "cloud_breach",        "user": "aws_root",            "ip": "54.210.12.88",  "country": "USA",         "severity": "critical", "description": "Root AWS console login without MFA from unrecognized IP — all S3 buckets now public-read"},
]


def _ts(minutes_ago: int) -> str:
    return (datetime.now() - timedelta(minutes=minutes_ago)).strftime("%H:%M:%S")


# ─── INCIDENT MANAGER ───────────────────────────────────────────────────────

class IncidentManager:
    """Manages real and simulated incidents for the ARGUS ecosystem."""
    def __init__(self):
        self.incidents = []
        self._last_id = 20240440

    def create_incident(self, title: str, severity: str, events: list, vector: str):
        self._last_id += 1
        incident = {
            "incident_id": f"INC-{self._last_id}",
            "title": title,
            "severity": severity,
            "summary": "",  # To be filled by AI
            "timeline": events,
            "affected_records": random.randint(100, 5000) if "data" in vector.lower() else 0,
            "attack_vector": vector,
            "dwell_time": f"{random.randint(5, 120)} minutes",
            "status": "active",
            "created_at": datetime.now()
        }
        self.incidents.insert(0, incident)
        return incident

    def get_latest(self):
        if not self.incidents:
            return None
        return self.incidents[0]

incident_manager = IncidentManager()


# ─── THREAT DETECTION LOGIC ──────────────────────────────────────────────────

async def _detect_local_threats() -> list[dict]:
    """
    Real-world threat detection running on the local system.
    Scans processes and network telemetry for actual indicators of compromise.
    """
    local_events = []
    
    # 1. Suspicious Process Detection
    try:
        FLAGGED_PROCESSES = {
            "powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe", 
            "mshta.exe", "regsvr32.exe", "rundll32.exe", "wmic.exe",
            "bash", "nc", "nmap", "wireshark", "python.exe"
        }
        
        for proc in psutil.process_iter(["pid", "name", "username", "cpu_percent"]):
            try:
                pinfo = proc.info
                name = (pinfo.get("name") or "").lower()
                cpu = pinfo.get("cpu_percent") or 0
                
                # Logic: Suspicious name OR excessive CPU from unknown background proc
                if name in FLAGGED_PROCESSES:
                    local_events.append({
                        "id": f"LCL-{pinfo['pid']}",
                        "event": "suspicious_process",
                        "user": pinfo.get("username") or "unknown",
                        "ip": "127.0.0.1",
                        "country": "Local System",
                        "severity": "high" if cpu < 50 else "critical",
                        "description": f"Active {name} process detected (PID: {pinfo['pid']}). Potential manual reconnaissance or script execution.",
                        "timestamp": datetime.now().strftime("%H:%M:%S")
                    })
                elif cpu > 85.0:
                    local_events.append({
                        "id": f"LCL-{pinfo['pid']}",
                        "event": "resource_exhaustion",
                        "user": pinfo.get("username") or "system",
                        "ip": "127.0.0.1",
                        "country": "Local System",
                        "severity": "medium",
                        "description": f"Process {name} consuming {cpu}% CPU. Possible cryptominer or denial-of-service behavior.",
                        "timestamp": datetime.now().strftime("%H:%M:%S")
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    except Exception as e:
        logger.warning(f"Process scan failed: {e}")

    # 2. Network Anomaly Detection
    try:
        SUSPICIOUS_PORTS = {4444, 6667, 1337, 31337, 9001, 8080}
        connections = psutil.net_connections(kind="inet")
        
        # Only check a sample to avoid API rate limits
        ext_conns = [c for c in connections if c.status == "ESTABLISHED" and c.raddr and not c.raddr.ip.startswith(_INTERNAL_PREFIXES)]
        
        for conn in ext_conns[:3]:
            ip = conn.raddr.ip
            port = conn.raddr.port
            
            severity = "medium"
            desc = f"Active connection to external IP {ip} on port {port}."
            
            if port in SUSPICIOUS_PORTS:
                severity = "critical"
                desc = f"C2 communication pattern detected. Connection to {ip} on known malicious port {port}."
            
            geo = await _enrich_ip(ip)
            if geo.get("risk_level") in ["HIGH", "CRITICAL"]:
                severity = "critical"
                desc += f" Destination flagged as high-risk ({geo.get('country')}, {geo.get('risk_factors', [])})."

            local_events.append({
                "id": f"NET-{random.randint(1000, 9999)}",
                "event": "network_anomaly",
                "user": "system_socket",
                "ip": ip,
                "country": geo.get("country", "Unknown"),
                "severity": severity,
                "description": desc,
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "geo": geo
            })
    except Exception as e:
        logger.warning(f"Network scan failed: {e}")

    return local_events


# ─── MODULE 1: SENTINEL ───────────────────────────────────────────────────────

@router.get("/sentinel/events")
async def get_sentinel_events():
    # 1. Get real local system threats
    real_threats = await _detect_local_threats()
    
    # 2. Get simulated events from pool
    pool = _EVENT_POOL.copy()
    random.shuffle(pool)
    sim_events = [
        {**ev, "id": f"EVT-{10000 + i}", "timestamp": _ts(random.randint(1, 59))}
        for i, ev in enumerate(pool[:6])
    ]

    # Enrich simulated external IPs (parallel)
    external = [(i, ev) for i, ev in enumerate(sim_events) if not ev["ip"].startswith(_INTERNAL_PREFIXES)]
    if external:
        geos = await asyncio.gather(*[_enrich_ip(ev["ip"]) for _, ev in external], return_exceptions=True)
        for (i, _), geo in zip(external, geos):
            if isinstance(geo, dict) and geo:
                sim_events[i]["geo"] = geo

    # 3. Merge and prioritize
    all_events = real_threats + sim_events
    all_events.sort(key=lambda x: ["critical", "high", "medium", "low"].index(x["severity"]))
    
    return {
        "events":         all_events[:12],
        "total_today":    random.randint(312, 487) + len(real_threats),
        "critical_count": sum(1 for e in all_events if e["severity"] == "critical"),
        "status":         "monitoring",
        "real_threats_detected": len(real_threats) > 0
    }


@router.get("/sentinel/stats")
def get_sentinel_stats():
    return {
        "threats_blocked":       random.randint(142, 189),
        "active_sessions":       random.randint(1200, 1847),
        "global_risk_score":     random.randint(42, 67),
        "phishing_blocked":      random.randint(28, 44),
        "anomalies_detected":    random.randint(12, 23),
        "endpoints_monitored":   random.randint(4200, 4850),
    }


# ─── MODULE 2: VEIL ───────────────────────────────────────────────────────────

class VeilRequest(BaseModel):
    content:  str
    provider: Optional[str] = "featherless"
    api_key:  Optional[str] = ""


def _extract_json(raw: str) -> dict:
    """
    Robustly extract JSON from model output that may contain:
    - Thinking tokens: <think>...</think>, <|thinking|>...</|thinking|>
    - Markdown fences: ```json ... ```
    - Plain JSON embedded in prose
    """
    import re

    # Strip all known reasoning/thinking token formats
    text = raw
    text = re.sub(r"<think>.*?</think>",           "", text, flags=re.DOTALL)
    text = re.sub(r"<\|thinking\|>.*?</\|thinking\|>", "", text, flags=re.DOTALL)
    text = re.sub(r"<\|thought\|>.*?</\|thought\|>",   "", text, flags=re.DOTALL)
    text = text.strip()

    # Strip markdown fences
    if "```" in text:
        parts = text.split("```")
        # Take the first fenced block
        for part in parts[1::2]:
            candidate = part.lstrip("json").strip()
            if candidate.startswith("{"):
                text = candidate
                break

    # Find the outermost JSON object
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in response")

    depth, end = 0, -1
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if end == -1:
        raise ValueError("Malformed JSON — unmatched braces")

    return json.loads(text[start:end])


async def _run_veil_ai(content: str, score: int, reasons: list[str]) -> dict:
    """Run AI analysis. Tries Featherless (Qwen3.6) → NVIDIA (Nemotron) as fallback."""
    prompt = _VEIL_PROMPT.format(
        content=content[:1500],
        rules=", ".join(reasons) if reasons else "None detected",
        score=score,
    )
    routers_to_try = []
    if settings.FEATHERLESS_API_KEY:
        routers_to_try.append(veil_router())
    if settings.NVIDIA_API_KEY:
        routers_to_try.append(nvidia_router())
    if not routers_to_try:
        return {}
    for ai_router in routers_to_try:
        try:
            raw = await ai_router.agenerate(prompt)
            return _extract_json(raw)
        except Exception as exc:
            logger.warning(f"VEIL AI attempt failed ({ai_router.provider}/{ai_router.model}): {exc}")
            continue
    return {}


@router.post("/veil/debug")
def veil_debug(req: VeilRequest):
    """Raw model output for debugging."""
    score, _, reasons = analyze_email(req.content)
    prompt = _VEIL_PROMPT.format(
        content=req.content[:1500],
        rules=", ".join(reasons) if reasons else "None",
        score=score,
    )
    raw = veil_router().generate(prompt)
    return {"raw": raw, "length": len(raw)}


@router.post("/veil/analyze")
async def veil_analyze(req: VeilRequest):
    score, label, reasons = analyze_email(req.content)

    # Extract URLs for parallel reputation check
    urls = _extract_urls(req.content)

    # Run AI analysis + URL reputation checks in parallel
    tasks = [_run_veil_ai(req.content, score, reasons)]
    tasks += [_check_url_reputation(u) for u in urls[:3]]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    ai          = results[0] if isinstance(results[0], dict) else {}
    url_intel   = [r for r in results[1:] if isinstance(r, dict) and r and not r.get("error")]

    if isinstance(results[0], Exception):
        logger.warning(f"VEIL analysis failed: {results[0]}")

    final_score      = ai.get("risk_score", score)
    confidence       = ai.get("confidence")
    ai_analysis      = ai.get("executive_summary", "")
    ai_indicators    = ai.get("detected_indicators", [])
    ai_actions       = ai.get("recommended_actions", [])
    psych_vectors    = ai.get("psychological_vectors", [])
    attack_class     = ai.get("attack_classification", label.lower().replace(" ", "_"))

    all_indicators = list(dict.fromkeys(reasons + ai_indicators))

    if not ai_analysis:
        ai_analysis = (
            f"ARGUS Pattern Engine: {label} confirmed. Primary vector: {reasons[0]}. "
            f"{'Immediate containment recommended.' if score >= 45 else 'Monitor for further signals.'}"
        ) if reasons else "ARGUS Pattern Engine: No significant threat indicators detected."

    if final_score >= 70:
        risk_level, verdict = "critical", "CONFIRMED THREAT"
    elif final_score >= 45:
        risk_level, verdict = "high", "HIGH RISK"
    elif final_score >= 20:
        risk_level, verdict = "medium", "SUSPICIOUS"
    else:
        risk_level, verdict = "low", "CLEAR"

    return {
        "risk_score":          min(final_score, 100),
        "risk_level":          risk_level,
        "verdict":             verdict,
        "label":               label,
        "attack_classification": attack_class,
        "confidence":          confidence,
        "indicators":          all_indicators,
        "psychological_vectors": psych_vectors,
        "ai_analysis":         ai_analysis,
        "recommended_actions": ai_actions or (
            ["Block sender domain", "Report to SOC", "Notify affected users", "Reset credentials"] if final_score >= 45
            else ["Log for audit trail", "Monitor for recurrence"]
        ),
        "recommendation": (
            "Block and escalate to SOC immediately" if final_score >= 45
            else "No immediate action — log for audit trail"
        ),
        "ai_powered":       bool(ai),
        "url_intelligence": url_intel,
        "urls_found":       urls[:3],
    }


@router.post("/veil/stream")
async def veil_stream(req: VeilRequest):
    """Server-Sent Events endpoint — streams AI analysis in real time."""
    score, _, reasons = analyze_email(req.content)

    prompt = _VEIL_PROMPT.format(
        content=req.content[:1500],
        rules=", ".join(reasons) if reasons else "None detected",
        score=score,
    )

    router = veil_router()

    async def event_stream():
        try:
            async for chunk in router.stream(prompt):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ─── MODULE 3: IDENTITY ───────────────────────────────────────────────────────

class IdentityRequest(BaseModel):
    username:       str
    login_country:  Optional[str] = "India"
    usual_country:  Optional[str] = "India"
    login_hour:     Optional[int] = 10
    is_new_device:  Optional[bool] = False
    download_spike: Optional[bool] = False
    failed_attempts: Optional[int] = 0
    vpn_detected:   Optional[bool] = False
    tor_detected:   Optional[bool] = False


@router.post("/identity/score")
def get_identity_score(req: IdentityRequest):
    score = 100
    flags = []

    if req.login_country != req.usual_country:
        score -= 40
        flags.append(f"Geographic anomaly — login from {req.login_country}, registered location: {req.usual_country}")

    if req.login_hour < 6 or req.login_hour > 22:
        score -= 25
        flags.append(f"Temporal anomaly — login at {req.login_hour:02d}:00 (outside 06:00–22:00 authorized window)")

    if req.is_new_device:
        score -= 20
        flags.append("Device anomaly — unrecognized device fingerprint, no authentication history")

    if req.download_spike:
        score -= 30
        flags.append("Behavioral anomaly — abnormal file download volume, possible data exfiltration pattern")

    if req.failed_attempts >= 3:
        score -= 15
        flags.append(f"Authentication anomaly — {req.failed_attempts} failed attempts before success")

    if req.vpn_detected:
        score -= 10
        flags.append("Network anomaly — VPN detected, masking true geolocation")

    if req.tor_detected:
        score -= 35
        flags.append("Critical network anomaly — Tor anonymization network detected, identity masking confirmed")

    score = max(score, 0)

    if score >= 80:
        risk, verdict, action = "low",      "TRUSTED",      "No action required — continue monitoring"
    elif score >= 55:
        risk, verdict, action = "medium",   "SUSPICIOUS",   "Enforce step-up MFA — enhanced session monitoring for 72h"
    elif score >= 25:
        risk, verdict, action = "high",     "HIGH RISK",    "Suspend session — force re-authentication with hardware MFA"
    else:
        risk, verdict, action = "critical", "COMPROMISED",  "Terminate all sessions — alert SOC — initiate incident response"

    return {
        "username":           req.username,
        "trust_score":        score,
        "risk_level":         risk,
        "verdict":            verdict,
        "flags":              flags,
        "recommendation":     action,
        "zero_trust_verdict": "DENY" if score < 50 else "ALLOW_WITH_MONITORING" if score < 80 else "ALLOW",
    }


# ─── MODULE 4: ORACLE ─────────────────────────────────────────────────────────

_oracle_cache: dict = {"data": None, "expires": 0.0}


@router.get("/oracle/timeline")
async def get_oracle_timeline():
    global _oracle_cache
    now_ts = time.time()
    if _oracle_cache["data"] and now_ts < _oracle_cache["expires"]:
        return _oracle_cache["data"]

    now = datetime.now()
    t   = lambda m: (now - timedelta(minutes=m)).strftime("%H:%M")

    events = [
        {"time": t(47), "event": "Spear-phishing email delivered — spoofed domain mimicking institutional HR",     "actor": "External → prof.johnson@univ.edu", "severity": "high",     "module": "VEIL"},
        {"time": t(41), "event": "Credentials submitted on spoofed portal — session token issued",                "actor": "prof.johnson@univ.edu",            "severity": "critical", "module": "IDENTITY"},
        {"time": t(38), "event": "Successful login from Beijing, China — impossible travel confirmed",             "actor": "IP: 203.45.12.88",                 "severity": "critical", "module": "SENTINEL"},
        {"time": t(34), "event": "Admin dashboard accessed via replayed session token",                           "actor": "Compromised session",              "severity": "critical", "module": "SENTINEL"},
        {"time": t(29), "event": "Student database queried — 89,241 records exfiltrated via API",                 "actor": "Compromised session",              "severity": "critical", "module": "ORACLE"},
        {"time": t(21), "event": "2.4 GB transferred to external endpoint — domain 48h old",                     "actor": "IP: 185.220.101.14 (Romania)",     "severity": "critical", "module": "SENTINEL"},
        {"time": t(14), "event": "Lateral movement attempt — 4 internal hosts scanned via SMB",                  "actor": "IP: 10.0.0.99 (Internal)",         "severity": "high",     "module": "SENTINEL"},
        {"time": t(8),  "event": "Session terminated — account quarantined — access revoked across all services", "actor": "ARGUS Autonomous Response Engine",  "severity": "low",      "module": "RESPONSE"},
    ]

    affected = random.randint(65000, 89000)
    vector   = "Spear Phishing → Credential Theft → Session Hijack → Data Exfiltration → Lateral Movement"
    dwell    = "47 minutes"

    static_summary = (
        "A coordinated spear-phishing campaign successfully compromised a senior faculty administrator account "
        "through a spoofed institutional domain. The threat actor leveraged stolen credentials and session token replay "
        f"to access the university student database, exfiltrating 2.4 GB of records affecting {affected:,} identities "
        "before ARGUS autonomous detection triggered containment and session termination."
    )

    ai_summary = static_summary
    ai_powered = False
    try:
        timeline_text = "\n".join(f"{e['time']} — {e['event']} ({e['actor']})" for e in events)
        prompt = _ORACLE_PROMPT.format(
            timeline=timeline_text, vector=vector, records=f"{affected:,}", dwell=dwell
        )
        if settings.NVIDIA_API_KEY:
            raw = await nvidia_router().agenerate(prompt)
        elif settings.FEATHERLESS_API_KEY:
            raw = await oracle_router().agenerate(prompt)
        else:
            raw = None
        if raw:
            ai_summary = _strip_thinking(raw) or static_summary
            ai_powered = True
    except Exception as exc:
        logger.warning(f"ORACLE AI narrative failed: {exc}")

    result = {
        "incident_id":       f"INC-{random.randint(10000, 99999)}",
        "severity":          "critical",
        "title":             "Advanced Persistent Threat — Credential Compromise & Multi-Stage Data Exfiltration",
        "summary":           ai_summary,
        "timeline":          events,
        "affected_records":  affected,
        "attack_vector":     vector,
        "dwell_time":        dwell,
        "ai_powered":        ai_powered,
    }
    _oracle_cache["data"]    = result
    _oracle_cache["expires"] = now_ts + 90  # Cache 90 seconds
    return result


# ─── MODULE 5: SKYNET ─────────────────────────────────────────────────────────

@router.get("/skynet/scan")
def cloud_scan():
    findings = [
        {"id": "SKY-001", "severity": "critical", "issue": "Public S3 Bucket — World Readable",          "resource": "s3://univ-research-data-backup",   "detail": "18,421 student PII records accessible without authentication. ACL set to public-read. FERPA violation confirmed.", "cwe": "CWE-284"},
        {"id": "SKY-002", "severity": "critical", "issue": "Root Account MFA Disabled",                  "resource": "AWS Root Account",                 "detail": "Root credentials have no MFA. Single compromised password = total account takeover. Last activity: 14 days ago.", "cwe": "CWE-308"},
        {"id": "SKY-003", "severity": "critical", "issue": "Production Database Port 5432 Open to 0.0.0.0/0","resource": "rds-university-prod",           "detail": "PostgreSQL directly accessible from internet. No VPC restriction. Active connection attempts from 14 unique IPs in last 24h.", "cwe": "CWE-668"},
        {"id": "SKY-004", "severity": "high",     "issue": "Hardcoded AWS API Key in Public Repository", "resource": "github.com/univ/portal-backend",   "detail": "AWS key with s3:* and iam:* permissions committed in plain text. Key active. 14 days of potential unauthorized access.", "cwe": "CWE-798"},
        {"id": "SKY-005", "severity": "high",     "issue": "IAM Role AdministratorAccess Attached",      "resource": "iam-role-student-portal",          "detail": "Application runtime role has unrestricted administrative access. Violates least-privilege principle. Blast radius: full account.", "cwe": "CWE-269"},
        {"id": "SKY-006", "severity": "high",     "issue": "CloudTrail Logging Disabled — us-east-1",    "resource": "AWS CloudTrail",                   "detail": "No API audit logging in primary region. Unauthorized actions since disable date are undetectable and unrecoverable.", "cwe": "CWE-778"},
        {"id": "SKY-007", "severity": "medium",   "issue": "RDS Snapshot Unencrypted — 340 GB",          "resource": "rds-snapshot-2026-04-28",          "detail": "Production backup stored without encryption. Snapshot shareable by default. Contains full student database.", "cwe": "CWE-311"},
        {"id": "SKY-008", "severity": "medium",   "issue": "Security Groups — Ingress 0.0.0.0/0 Port 22","resource": "sg-0a1b2c3d4e5f (webserver)",      "detail": "SSH open to the entire internet. Exposes 3 EC2 instances to brute-force and zero-day exploit attempts.", "cwe": "CWE-923"},
        {"id": "SKY-009", "severity": "low",      "issue": "IAM Access Keys Inactive 180+ Days",         "resource": "iam-user-legacy-svc",              "detail": "Stale credentials still active. Should be rotated or decommissioned. Risk if compromised in historical breach.", "cwe": "CWE-324"},
    ]

    compliance_score = 34
    return {
        "scan_id":           f"SCAN-{random.randint(1000, 9999)}",
        "scanned_at":        datetime.now().isoformat(),
        "total_findings":    len(findings),
        "critical":          sum(1 for f in findings if f["severity"] == "critical"),
        "high":              sum(1 for f in findings if f["severity"] == "high"),
        "medium":            sum(1 for f in findings if f["severity"] == "medium"),
        "low":               sum(1 for f in findings if f["severity"] == "low"),
        "findings":          findings,
        "compliance_score":  compliance_score,
        "compliance_grade":  "F",
        "resources_scanned": random.randint(47, 83),
        "frameworks_checked": ["SOC 2 Type II", "FERPA", "NIST CSF", "CIS AWS Foundations"],
    }


# ─── MODULE 6: RESPONSE ───────────────────────────────────────────────────────

class ResponseRequest(BaseModel):
    severity:   str
    event_type: str
    user:       Optional[str] = "unknown"


@router.post("/response/recommend")
async def get_response_recommendations(req: ResponseRequest):
    # Try AI-enhanced response first
    ai_response = {}
    try:
        if settings.FEATHERLESS_API_KEY or settings.NVIDIA_API_KEY:
            prompt = _RESPONSE_PROMPT.format(
                severity=req.severity,
                event_type=req.event_type,
                user=req.user,
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            )
            provider = "nvidia" if settings.NVIDIA_API_KEY else "featherless"
            api_key  = settings.NVIDIA_API_KEY or settings.FEATHERLESS_API_KEY
            model    = settings.NVIDIA_MODEL if provider == "nvidia" else settings.FEATHERLESS_MODEL_SEC
            raw         = await AIRouter(provider, api_key, model=model).agenerate(prompt)
            ai_response = _extract_json(raw)
    except Exception as exc:
        logger.warning(f"RESPONSE AI failed: {exc}")

    if ai_response.get("immediate_actions"):
        immediate = [a["action"] if isinstance(a, dict) else a for a in ai_response["immediate_actions"]]
        followup  = [a["action"] if isinstance(a, dict) else a for a in ai_response.get("followup_actions", [])]
        eta       = ai_response.get("estimated_response_time", "< 15 minutes")
        escalate  = ai_response.get("escalation_required", req.severity in ["critical", "high"])
    elif req.severity in ("critical", "high"):
        immediate = [
            "Terminate all active sessions for the affected account immediately",
            "Force password reset with mandatory MFA enforcement across all services",
            "Block source IP at perimeter firewall, WAF, and cloud security groups",
            "Isolate affected endpoint from network — quarantine mode activated",
            "Notify SOC and escalate to incident commander within 15 minutes",
            "Preserve all logs and forensic artifacts — do not remediate before capture",
        ]
        followup = [
            "Conduct full forensic timeline analysis across all affected systems",
            "Review all activity logs for compromised account (last 30 days)",
            "Audit adjacent accounts for signs of lateral compromise",
            "Submit incident report to CISO and legal counsel within 4 hours",
            "Notify affected users per FERPA/GDPR breach disclosure requirements",
            "Implement emergency IAM policy changes based on findings",
        ]
        eta, escalate = "< 15 minutes", True
    elif req.severity == "medium":
        immediate = [
            "Enforce step-up authentication for the current session",
            "Flag account for enhanced behavioral monitoring (72h window)",
            "Alert account owner via out-of-band secondary channel",
        ]
        followup = [
            "Review recent access patterns and privilege usage",
            "Verify endpoint compliance status and patch level",
            "Schedule mandatory security awareness training",
        ]
        eta, escalate = "< 2 hours", False
    else:
        immediate = ["Log event with full context in audit trail", "Mark for weekly security review"]
        followup  = ["Include in next security posture report"]
        eta, escalate = "Next business day", False

    return {
        "incident_severity":      req.severity,
        "event_type":             req.event_type,
        "target_user":            req.user,
        "immediate_actions":      immediate,
        "followup_actions":       followup,
        "estimated_response_time": eta,
        "escalation_required":    escalate,
        "generated_at":           datetime.now().strftime("%H:%M:%S"),
        "ai_enhanced":            bool(ai_response),
        "playbook_id":            f"PB-{random.randint(1000, 9999)}",
    }
