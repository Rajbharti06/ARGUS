"""
ARGUS PHANTOM — Deception Network & Honeypot Management API
6 honeypot types + attacker session capture + behavioral DNA encoding + canary tokens.
"""

import random
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel

router = APIRouter()


# ── Honeypot Definitions ──────────────────────────────────────────────────────

HONEYPOTS = [
    {
        "id":       "HP-001",
        "name":     "HOLLOW-DB",
        "type":     "Database Honeypot",
        "protocol": "PostgreSQL",
        "port":     5432,
        "ip":       "10.0.100.10",
        "lure":     "Fake research database — 50,000 'student records'",
        "status":   "active",
        "tier":     "high-interaction",
        "engagements": 3,
        "last_hit": "03:14:22",
        "color":    "#FF3B5C",
    },
    {
        "id":       "HP-002",
        "name":     "GHOST-SSH",
        "type":     "SSH Honeypot",
        "protocol": "OpenSSH",
        "port":     22,
        "ip":       "10.0.100.20",
        "lure":     "Exposed SSH server — accepts any credential for delayed login",
        "status":   "active",
        "tier":     "high-interaction",
        "engagements": 847,
        "last_hit": "03:11:07",
        "color":    "#f97316",
    },
    {
        "id":       "HP-003",
        "name":     "SPECTER-SMB",
        "type":     "File Share Honeypot",
        "protocol": "SMB/CIFS",
        "port":     445,
        "ip":       "10.0.100.30",
        "lure":     "Fake ADMIN$ share with canary documents",
        "status":   "active",
        "tier":     "medium-interaction",
        "engagements": 12,
        "last_hit": "02:58:44",
        "color":    "#a855f7",
    },
    {
        "id":       "HP-004",
        "name":     "MIRAGE-WEB",
        "type":     "Web Application Honeypot",
        "protocol": "HTTP/HTTPS",
        "port":     8080,
        "ip":       "10.0.100.40",
        "lure":     "Fake admin portal — logs all POST data and headers",
        "status":   "active",
        "tier":     "high-interaction",
        "engagements": 231,
        "last_hit": "03:08:17",
        "color":    "#7ba3c4",
    },
    {
        "id":       "HP-005",
        "name":     "VIPER-MAIL",
        "type":     "Email Honeypot",
        "protocol": "SMTP/IMAP",
        "port":     25,
        "ip":       "10.0.100.50",
        "lure":     "admin@honeypot.univ.edu — tracks phishing campaign pivoting",
        "status":   "active",
        "tier":     "low-interaction",
        "engagements": 44,
        "last_hit": "02:45:33",
        "color":    "#eab308",
    },
    {
        "id":       "HP-006",
        "name":     "ECHO-API",
        "type":     "API Honeypot",
        "protocol": "REST/JSON",
        "port":     3000,
        "ip":       "10.0.100.60",
        "lure":     "Fake internal API — logs all endpoint enumeration attempts",
        "status":   "active",
        "tier":     "medium-interaction",
        "engagements": 67,
        "last_hit": "02:39:11",
        "color":    "#6b9e7a",
    },
]


# ── Canary Tokens ─────────────────────────────────────────────────────────────

CANARY_TOKENS = [
    {"id": "CT-001", "type": "PDF Document", "name": "student_pii_backup_2026.pdf",
     "location": "s3://univ-research-data/backups/", "triggered": True, "triggered_at": "03:14:07",
     "trigger_ip": "185.220.101.14", "description": "Document opened — exfil attempt confirmed"},
    {"id": "CT-002", "type": "Excel File",   "name": "faculty_salaries_Q2_2026.xlsx",
     "location": "\\\\fileserver\\HR\\confidential\\", "triggered": True, "triggered_at": "02:58:22",
     "trigger_ip": "10.0.4.23", "description": "File accessed by lateral movement actor"},
    {"id": "CT-003", "type": "AWS Key",      "name": "aws_backup_key.txt",
     "location": "GitHub repo: univ/portal-backend", "triggered": True, "triggered_at": "2026-05-08",
     "trigger_ip": "142.250.80.46", "description": "API key used — credential exfiltrated 14 days ago"},
    {"id": "CT-004", "type": "DNS Token",    "name": "internal-api.honeypot.univ.edu",
     "location": "Planted in config files", "triggered": False, "triggered_at": None,
     "trigger_ip": None, "description": "DNS canary — monitors for credential reuse"},
    {"id": "CT-005", "type": "Web Bug",      "name": "Internal wiki canary pixel",
     "location": "wiki.univ.edu/admin/passwords", "triggered": False, "triggered_at": None,
     "trigger_ip": None, "description": "HTTP canary — monitors page access"},
]


# ── Attacker Sessions ─────────────────────────────────────────────────────────

def _build_sessions() -> list[dict]:
    now = datetime.now()
    return [
        {
            "session_id":    "SES-8821-A",
            "honeypot":      "HP-001 (HOLLOW-DB)",
            "attacker_ip":   "185.220.101.14",
            "country":       "Romania",
            "asn":           "AS60729 (TOR)",
            "started":       (now - timedelta(minutes=47)).strftime("%H:%M:%S"),
            "duration":      "47m 13s",
            "queries":       random.randint(2400, 3100),
            "data_read_mb":  round(random.uniform(1.2, 4.8), 1),
            "behavior_dna":  _compute_dna("db_scanner_apt"),
            "classification": "APT — Data Exfiltration",
            "tactics_observed": ["Collection", "Exfiltration"],
            "confidence":    97,
            "color":         "#FF3B5C",
        },
        {
            "session_id":    "SES-4417-B",
            "honeypot":      "HP-002 (GHOST-SSH)",
            "attacker_ip":   "185.220.101.45",
            "country":       "Russia",
            "asn":           "AS60729 (TOR exit)",
            "started":       (now - timedelta(hours=2, minutes=13)).strftime("%H:%M:%S"),
            "duration":      "2h 13m",
            "queries":       847,
            "data_read_mb":  0.0,
            "behavior_dna":  _compute_dna("brute_force_bot"),
            "classification": "Credential Stuffing Bot",
            "tactics_observed": ["Initial Access", "Credential Access"],
            "confidence":    91,
            "color":         "#f97316",
        },
        {
            "session_id":    "SES-2291-C",
            "honeypot":      "HP-004 (MIRAGE-WEB)",
            "attacker_ip":   "94.102.49.190",
            "country":       "Ukraine",
            "asn":           "AS29182",
            "started":       (now - timedelta(minutes=89)).strftime("%H:%M:%S"),
            "duration":      "1h 29m",
            "queries":       231,
            "data_read_mb":  0.4,
            "behavior_dna":  _compute_dna("web_scanner_owasp"),
            "classification": "Automated Web Scanner",
            "tactics_observed": ["Reconnaissance", "Initial Access"],
            "confidence":    84,
            "color":         "#eab308",
        },
    ]


def _compute_dna(profile: str) -> str:
    """Generate a reproducible behavioral DNA hash from attacker profile."""
    return hashlib.sha256(profile.encode()).hexdigest()[:24].upper()


def _format_dna_display(dna: str) -> list[dict]:
    """Format DNA string as colored segments for UI visualization."""
    colors = {"0": "#FF3B5C", "1": "#f97316", "2": "#eab308", "3": "#6b9e7a",
              "4": "#7ba3c4", "5": "#a855f7", "6": "#6d8588", "7": "#c8a96e",
              "8": "#FF3B5C", "9": "#f97316", "A": "#FF3B5C", "B": "#a855f7",
              "C": "#7ba3c4", "D": "#eab308", "E": "#6b9e7a", "F": "#6d8588"}
    return [{"char": c, "color": colors.get(c, "#6d8588")} for c in dna]


@router.get("/honeypots")
def get_honeypots():
    """Return all active honeypots with engagement statistics."""
    now = datetime.now()
    hps = []
    for hp in HONEYPOTS:
        h = dict(hp)
        h["uptime_pct"] = round(random.uniform(99.1, 99.9), 1)
        h["alerts_24h"] = random.randint(2, 50)
        h["bandwidth_mb"] = round(random.uniform(0.1, 12.4), 1)
        hps.append(h)
    return {
        "honeypots":      hps,
        "total":          len(hps),
        "total_engagements": sum(h["engagements"] for h in HONEYPOTS),
        "active":         sum(1 for h in HONEYPOTS if h["status"] == "active"),
        "timestamp":      now.isoformat(),
    }


@router.get("/sessions")
def get_sessions():
    """Return active attacker sessions with behavioral DNA."""
    sessions = _build_sessions()
    for s in sessions:
        s["dna_display"] = _format_dna_display(s["behavior_dna"])
    return {
        "sessions":        sessions,
        "total_active":    len(sessions),
        "total_all_time":  random.randint(1847, 2200),
        "unique_attackers":random.randint(312, 420),
    }


@router.get("/canary")
def get_canary_tokens():
    """Return canary token status."""
    triggered = [c for c in CANARY_TOKENS if c["triggered"]]
    untriggered = [c for c in CANARY_TOKENS if not c["triggered"]]
    return {
        "tokens":       CANARY_TOKENS,
        "total":        len(CANARY_TOKENS),
        "triggered":    len(triggered),
        "untriggered":  len(untriggered),
        "alert_rate":   f"{round(len(triggered)/len(CANARY_TOKENS)*100)}%",
    }


@router.get("/intelligence")
def get_phantom_intelligence():
    """Return aggregated threat intelligence from honeypot sessions."""
    sessions = _build_sessions()
    top_ips = [
        {"ip": s["attacker_ip"], "country": s["country"], "sessions": random.randint(3, 847),
         "classification": s["classification"], "color": s["color"]}
        for s in sessions
    ]
    return {
        "top_attacker_ips": top_ips,
        "attack_patterns":  [
            {"pattern": "Credential Stuffing", "count": 847, "color": "#f97316"},
            {"pattern": "Data Exfiltration",   "count": 3,   "color": "#FF3B5C"},
            {"pattern": "Web Scanning",        "count": 231, "color": "#eab308"},
            {"pattern": "Port Reconnaissance", "count": 67,  "color": "#a855f7"},
            {"pattern": "SMB Lateral Move",    "count": 12,  "color": "#FF3B5C"},
        ],
        "total_blocked":    random.randint(1847, 2100),
        "new_iocs_24h":     random.randint(12, 28),
    }
