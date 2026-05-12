"""
ARGUS — Multi-Source Threat Intelligence Service
Aggregates: ip-api.com (always) + AbuseIPDB (optional) + GreyNoise Community (optional)
+ TOR exit node check + MITRE ATT&CK TTP mapping
All external calls use short timeouts so the UI never hangs.
"""

import asyncio
from datetime import datetime
from typing import Optional
import httpx

from app.core.config import settings
from app.core.logging import logger


# ── MITRE ATT&CK TTP Mapping ────────────────────────────────────────────────
# Maps internal ARGUS event types → real ATT&CK Technique IDs + names + tactics

TTP_MAP: dict[str, dict] = {
    # Credential attacks
    "brute_force":          {"id": "T1110",     "name": "Brute Force",                          "tactic": "Credential Access"},
    "credential_stuffing":  {"id": "T1110.004", "name": "Credential Stuffing",                  "tactic": "Credential Access"},
    "password_spray":       {"id": "T1110.003", "name": "Password Spraying",                    "tactic": "Credential Access"},
    "token_replay":         {"id": "T1550.001", "name": "Pass the Cookie",                      "tactic": "Defense Evasion"},
    "api_key_leak":         {"id": "T1552.001", "name": "Credentials In Files",                 "tactic": "Credential Access"},

    # Identity & Account
    "impossible_travel":    {"id": "T1078",     "name": "Valid Accounts",                       "tactic": "Defense Evasion"},
    "midnight_admin":       {"id": "T1078.002", "name": "Domain Accounts",                      "tactic": "Persistence"},
    "new_admin_account":    {"id": "T1136.001", "name": "Local Account Creation",               "tactic": "Persistence"},
    "identity_anomaly":     {"id": "T1078",     "name": "Valid Accounts",                       "tactic": "Defense Evasion"},
    "identity_compromise":  {"id": "T1098",     "name": "Account Manipulation",                 "tactic": "Persistence"},

    # Network & C2
    "vpn_anomaly":          {"id": "T1090.003", "name": "Multi-hop Proxy",                      "tactic": "Command and Control"},
    "dns_tunneling":        {"id": "T1071.004", "name": "DNS Protocol (C2)",                    "tactic": "Command and Control"},
    "suspicious_connection":{"id": "T1071",     "name": "Application Layer Protocol",           "tactic": "Command and Control"},
    "c2_beacon":            {"id": "T1071.001", "name": "Web Protocols (C2 Beaconing)",         "tactic": "Command and Control"},

    # Lateral Movement
    "lateral_movement":     {"id": "T1021.002", "name": "SMB/Windows Admin Shares",            "tactic": "Lateral Movement"},

    # Exfiltration
    "mass_download":        {"id": "T1005",     "name": "Data from Local System",               "tactic": "Collection"},
    "data_exfiltration":    {"id": "T1567.002", "name": "Exfiltration to Cloud Storage",        "tactic": "Exfiltration"},

    # Phishing
    "phishing_campaign":    {"id": "T1566.001", "name": "Spear Phishing Attachment",            "tactic": "Initial Access"},
    "phishing_detected":    {"id": "T1566",     "name": "Phishing",                             "tactic": "Initial Access"},
    "vishing":              {"id": "T1566.004", "name": "Spear Phishing Voice",                 "tactic": "Initial Access"},

    # Execution
    "suspicious_process":   {"id": "T1059",     "name": "Command and Scripting Interpreter",   "tactic": "Execution"},
    "powershell_exec":      {"id": "T1059.001", "name": "PowerShell",                           "tactic": "Execution"},
    "wscript_exec":         {"id": "T1059.005", "name": "Visual Basic",                         "tactic": "Execution"},

    # Impact
    "ransomware_behavior":  {"id": "T1486",     "name": "Data Encrypted for Impact",            "tactic": "Impact"},
    "cloud_breach":         {"id": "T1078.004", "name": "Cloud Accounts",                       "tactic": "Defense Evasion"},
}

# Kill chain phase ordering for ORACLE correlation
KILL_CHAIN_ORDER = [
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Defense Evasion",
    "Credential Access",
    "Discovery",
    "Lateral Movement",
    "Collection",
    "Command and Control",
    "Exfiltration",
    "Impact",
]

# Known threat actor IOCs (curated, kept minimal for demo)
THREAT_ACTOR_IPS = {
    "185.220.101.": "Tor exit node / Anonymous relay (ShinyHunters linked)",
    "94.102.49.":   "Bulletproof hosting — Everest ransomware C2 infrastructure",
    "45.89.106.":   "Residential proxy network — credential stuffing origin",
    "77.88.21.":    "Russia-based VPS — APT28 adjacent infrastructure",
}

# Known malicious ASNs
MALICIOUS_ASNS = {
    "AS60068":  "Dataclub — known bulletproof hosting",
    "AS206485": "Frantech Solutions — hosting for APT groups",
    "AS49453":  "Global Layer — ransomware C2 infrastructure",
    "AS208323": "Aeza International — malicious hosting",
}


def get_ttp(event_type: str) -> Optional[dict]:
    """Return MITRE ATT&CK TTP metadata for an event type, or None."""
    return TTP_MAP.get(event_type)


def map_process_to_ttp(process_name: str) -> Optional[dict]:
    """Map a suspicious process name to its ATT&CK technique."""
    name = process_name.lower()
    if "powershell" in name:
        return TTP_MAP["powershell_exec"]
    if "wscript" in name or "cscript" in name:
        return TTP_MAP["wscript_exec"]
    if name in ("nc.exe", "nc", "ncat"):
        return TTP_MAP["c2_beacon"]
    return TTP_MAP.get("suspicious_process")


async def _query_abuseipdb(ip: str, api_key: str) -> dict:
    """Query AbuseIPDB for IP reputation. Returns abuse score + categories."""
    try:
        async with httpx.AsyncClient(timeout=4.0) as c:
            r = await c.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={"ipAddress": ip, "maxAgeInDays": 30, "verbose": False},
                headers={"Key": api_key, "Accept": "application/json"},
            )
            if r.status_code == 200:
                d = r.json().get("data", {})
                return {
                    "source":        "AbuseIPDB",
                    "abuse_score":   d.get("abuseConfidenceScore", 0),
                    "total_reports": d.get("totalReports", 0),
                    "last_reported": d.get("lastReportedAt"),
                    "isp":           d.get("isp"),
                    "domain":        d.get("domain"),
                    "tor":           d.get("isTor", False),
                    "whitelisted":   d.get("isWhitelisted", False),
                }
    except Exception as exc:
        logger.debug(f"AbuseIPDB lookup failed for {ip}: {exc}")
    return {}


async def _query_greynoise(ip: str, api_key: str) -> dict:
    """Query GreyNoise Community API for internet scanner classification."""
    try:
        async with httpx.AsyncClient(timeout=4.0) as c:
            r = await c.get(
                f"https://api.greynoise.io/v3/community/{ip}",
                headers={"key": api_key},
            )
            if r.status_code == 200:
                d = r.json()
                return {
                    "source":        "GreyNoise",
                    "noise":         d.get("noise", False),    # is this a known internet scanner?
                    "riot":          d.get("riot", False),     # is this a known benign service?
                    "classification": d.get("classification"), # "malicious" / "benign" / "unknown"
                    "name":          d.get("name"),
                    "message":       d.get("message"),
                    "last_seen":     d.get("last_seen"),
                }
            elif r.status_code == 404:
                return {"source": "GreyNoise", "noise": False, "riot": False, "classification": "unknown"}
    except Exception as exc:
        logger.debug(f"GreyNoise lookup failed for {ip}: {exc}")
    return {}


async def _query_ipapi(ip: str) -> dict:
    """Query ip-api.com — always available, no key required."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,country,countryCode,city,isp,org,as,proxy,hosting"},
            )
            d = r.json()
            if d.get("status") == "success":
                return d
    except Exception as exc:
        logger.debug(f"ip-api lookup failed for {ip}: {exc}")
    return {}


def _check_known_threat_actors(ip: str, asn: str = "") -> Optional[str]:
    """Check if IP prefix or ASN matches known threat actor infrastructure."""
    for prefix, intel in THREAT_ACTOR_IPS.items():
        if ip.startswith(prefix):
            return intel
    for asn_prefix, intel in MALICIOUS_ASNS.items():
        if asn_prefix.lower() in asn.lower():
            return intel
    return None


_HIGH_RISK_COUNTRIES = {
    "Russia", "China", "North Korea", "Iran", "Ukraine",
    "Romania", "Bulgaria", "Nigeria", "Belarus", "Moldova",
}
_INTERNAL_PREFIXES = ("10.", "192.168.", "127.", "172.16.", "172.17.", "172.18.",
                      "172.19.", "172.2", "172.30.", "172.31.", "::1")


async def enrich_ip_full(ip: str) -> dict:
    """
    Full multi-source IP enrichment:
      1. ip-api.com (always)
      2. AbuseIPDB (if key configured)
      3. GreyNoise (if key configured)
      4. Known threat actor prefix check

    Returns a unified threat intelligence dict with aggregate risk score.
    """
    if not ip or ip.startswith(_INTERNAL_PREFIXES):
        return {"ip": ip, "internal": True, "risk_level": "LOW", "risk_score": 0}

    # Launch all queries in parallel
    tasks = [_query_ipapi(ip)]
    if settings.ABUSEIPDB_API_KEY:
        tasks.append(_query_abuseipdb(ip, settings.ABUSEIPDB_API_KEY))
    else:
        tasks.append(asyncio.sleep(0))  # placeholder

    if settings.GREYNOISE_API_KEY:
        tasks.append(_query_greynoise(ip, settings.GREYNOISE_API_KEY))
    else:
        tasks.append(asyncio.sleep(0))  # placeholder

    results = await asyncio.gather(*tasks, return_exceptions=True)

    ipapi   = results[0] if isinstance(results[0], dict) else {}
    abuse   = results[1] if isinstance(results[1], dict) else {}
    gnoise  = results[2] if isinstance(results[2], dict) else {}

    # ── Aggregate risk scoring ──────────────────────────────────────────────
    risk_score   = 0
    risk_factors = []

    country = ipapi.get("country", "")
    asn     = ipapi.get("as", "")

    # ip-api signals
    if ipapi.get("proxy"):
        risk_score += 30
        risk_factors.append("VPN / Proxy anonymization")
    if ipapi.get("hosting"):
        risk_score += 15
        risk_factors.append("Cloud / VPS hosting (common C2 infra)")
    if country in _HIGH_RISK_COUNTRIES:
        risk_score += 25
        risk_factors.append(f"High-risk origin country: {country}")

    # AbuseIPDB signals
    abuse_score = abuse.get("abuse_score", 0)
    if abuse_score >= 75:
        risk_score += 40
        risk_factors.append(f"AbuseIPDB: {abuse_score}% abuse confidence ({abuse.get('total_reports',0)} reports)")
    elif abuse_score >= 40:
        risk_score += 25
        risk_factors.append(f"AbuseIPDB: moderate abuse score ({abuse_score}%)")
    elif abuse_score >= 10:
        risk_score += 10
        risk_factors.append(f"AbuseIPDB: low abuse reports ({abuse_score}%)")
    if abuse.get("tor"):
        risk_score += 30
        risk_factors.append("AbuseIPDB: TOR exit node confirmed")

    # GreyNoise signals
    if gnoise.get("classification") == "malicious":
        risk_score += 45
        risk_factors.append(f"GreyNoise: classified MALICIOUS — {gnoise.get('name', 'unknown actor')}")
    elif gnoise.get("noise"):
        risk_score += 20
        risk_factors.append("GreyNoise: known internet scanner / noise source")
    if gnoise.get("riot"):
        risk_score = max(risk_score - 20, 0)  # Known benign service — reduce score
        risk_factors.append("GreyNoise: RIOT — known benign service (score reduced)")

    # Known threat actor infrastructure
    actor_intel = _check_known_threat_actors(ip, asn)
    if actor_intel:
        risk_score += 35
        risk_factors.append(f"Known threat actor infrastructure: {actor_intel}")

    risk_score = min(risk_score, 100)
    risk_level = (
        "CRITICAL" if risk_score >= 70 else
        "HIGH"     if risk_score >= 45 else
        "MEDIUM"   if risk_score >= 20 else
        "LOW"
    )

    return {
        "ip":            ip,
        "country":       country,
        "country_code":  ipapi.get("countryCode"),
        "city":          ipapi.get("city"),
        "isp":           ipapi.get("isp") or abuse.get("isp"),
        "org":           ipapi.get("org"),
        "asn":           asn,
        "proxy":         ipapi.get("proxy", False),
        "hosting":       ipapi.get("hosting", False),
        "tor":           abuse.get("tor", False),
        "risk_score":    risk_score,
        "risk_level":    risk_level,
        "risk_factors":  risk_factors,
        "sources_used":  [s for s in ["ip-api", "AbuseIPDB" if abuse else None, "GreyNoise" if gnoise else None] if s],
        "abuse_score":   abuse_score,
        "greynoise":     {"classification": gnoise.get("classification"), "name": gnoise.get("name")} if gnoise else None,
        "threat_actor":  actor_intel,
        "queried_at":    datetime.utcnow().isoformat(),
    }
