"""
ARGUS — MITRE ATT&CK Matrix API
Full 14-tactic kill chain with technique coverage and detection status.
"""

import random
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()


# ── MITRE ATT&CK Tactics + Key Techniques ────────────────────────────────────

ATTACK_MATRIX = [
    {
        "id":     "TA0043",
        "tactic": "Reconnaissance",
        "color":  "#6d8588",
        "techniques": [
            {"id": "T1595", "name": "Active Scanning",          "detected": True,  "severity": "medium"},
            {"id": "T1592", "name": "Gather Host Info",         "detected": False, "severity": "low"},
            {"id": "T1589", "name": "Gather Identity Info",     "detected": True,  "severity": "medium"},
            {"id": "T1591", "name": "Gather Org Info",          "detected": False, "severity": "low"},
            {"id": "T1598", "name": "Phishing for Information", "detected": True,  "severity": "high"},
        ],
    },
    {
        "id":     "TA0042",
        "tactic": "Resource Development",
        "color":  "#6d8588",
        "techniques": [
            {"id": "T1583", "name": "Acquire Infrastructure",   "detected": False, "severity": "medium"},
            {"id": "T1584", "name": "Compromise Infrastructure","detected": True,  "severity": "high"},
            {"id": "T1587", "name": "Develop Capabilities",     "detected": False, "severity": "medium"},
            {"id": "T1588", "name": "Obtain Capabilities",      "detected": False, "severity": "low"},
        ],
    },
    {
        "id":     "TA0001",
        "tactic": "Initial Access",
        "color":  "#FF3B5C",
        "techniques": [
            {"id": "T1566.001", "name": "Spear Phishing Attachment", "detected": True,  "severity": "critical"},
            {"id": "T1566.002", "name": "Spear Phishing Link",       "detected": True,  "severity": "critical"},
            {"id": "T1190",     "name": "Exploit Public-Facing App", "detected": False, "severity": "high"},
            {"id": "T1133",     "name": "External Remote Services",  "detected": True,  "severity": "high"},
            {"id": "T1078",     "name": "Valid Accounts",            "detected": True,  "severity": "critical"},
            {"id": "T1195",     "name": "Supply Chain Compromise",   "detected": False, "severity": "high"},
        ],
    },
    {
        "id":     "TA0002",
        "tactic": "Execution",
        "color":  "#f97316",
        "techniques": [
            {"id": "T1059.001", "name": "PowerShell",               "detected": True,  "severity": "high"},
            {"id": "T1059.003", "name": "Windows Command Shell",    "detected": True,  "severity": "medium"},
            {"id": "T1059.005", "name": "Visual Basic",             "detected": False, "severity": "medium"},
            {"id": "T1204.002", "name": "Malicious File",           "detected": True,  "severity": "high"},
            {"id": "T1218",     "name": "LOLBin Execution",         "detected": True,  "severity": "high"},
            {"id": "T1569",     "name": "System Services",          "detected": False, "severity": "medium"},
        ],
    },
    {
        "id":     "TA0003",
        "tactic": "Persistence",
        "color":  "#a855f7",
        "techniques": [
            {"id": "T1053.005", "name": "Scheduled Task",           "detected": False, "severity": "high"},
            {"id": "T1136.001", "name": "Local Account Creation",   "detected": True,  "severity": "high"},
            {"id": "T1098",     "name": "Account Manipulation",     "detected": True,  "severity": "high"},
            {"id": "T1547",     "name": "Boot Autostart",           "detected": False, "severity": "medium"},
            {"id": "T1543",     "name": "Create/Modify Service",    "detected": False, "severity": "medium"},
        ],
    },
    {
        "id":     "TA0004",
        "tactic": "Privilege Escalation",
        "color":  "#a855f7",
        "techniques": [
            {"id": "T1055",     "name": "Process Injection",        "detected": False, "severity": "critical"},
            {"id": "T1068",     "name": "Exploitation for Priv Esc","detected": False, "severity": "critical"},
            {"id": "T1134",     "name": "Access Token Manipulation","detected": False, "severity": "high"},
            {"id": "T1548",     "name": "Abuse Elevation Control",  "detected": False, "severity": "high"},
        ],
    },
    {
        "id":     "TA0005",
        "tactic": "Defense Evasion",
        "color":  "#eab308",
        "techniques": [
            {"id": "T1070",     "name": "Indicator Removal",        "detected": True,  "severity": "high"},
            {"id": "T1078",     "name": "Valid Accounts",           "detected": True,  "severity": "critical"},
            {"id": "T1550.001", "name": "Pass the Cookie",          "detected": True,  "severity": "critical"},
            {"id": "T1218",     "name": "System Binary Proxy Exec", "detected": True,  "severity": "high"},
            {"id": "T1027",     "name": "Obfuscated Files/Info",    "detected": False, "severity": "medium"},
        ],
    },
    {
        "id":     "TA0006",
        "tactic": "Credential Access",
        "color":  "#FF3B5C",
        "techniques": [
            {"id": "T1110",     "name": "Brute Force",              "detected": True,  "severity": "critical"},
            {"id": "T1110.003", "name": "Password Spraying",        "detected": True,  "severity": "high"},
            {"id": "T1110.004", "name": "Credential Stuffing",      "detected": True,  "severity": "critical"},
            {"id": "T1003.001", "name": "LSASS Memory",             "detected": False, "severity": "critical"},
            {"id": "T1552.001", "name": "Credentials In Files",     "detected": True,  "severity": "high"},
            {"id": "T1558",     "name": "Steal Kerberos Tickets",   "detected": False, "severity": "critical"},
        ],
    },
    {
        "id":     "TA0007",
        "tactic": "Discovery",
        "color":  "#7ba3c4",
        "techniques": [
            {"id": "T1082",     "name": "System Info Discovery",    "detected": True,  "severity": "medium"},
            {"id": "T1083",     "name": "File & Dir Discovery",     "detected": False, "severity": "medium"},
            {"id": "T1016",     "name": "System Network Discovery", "detected": True,  "severity": "medium"},
            {"id": "T1018",     "name": "Remote System Discovery",  "detected": True,  "severity": "high"},
            {"id": "T1087",     "name": "Account Discovery",        "detected": False, "severity": "medium"},
        ],
    },
    {
        "id":     "TA0008",
        "tactic": "Lateral Movement",
        "color":  "#FF3B5C",
        "techniques": [
            {"id": "T1021.002", "name": "SMB/Windows Admin Shares", "detected": True,  "severity": "critical"},
            {"id": "T1021.001", "name": "Remote Desktop Protocol",  "detected": False, "severity": "high"},
            {"id": "T1550.002", "name": "Pass the Hash",            "detected": False, "severity": "critical"},
            {"id": "T1563",     "name": "Remote Service Session",   "detected": True,  "severity": "high"},
        ],
    },
    {
        "id":     "TA0009",
        "tactic": "Collection",
        "color":  "#c8a96e",
        "techniques": [
            {"id": "T1005",     "name": "Data from Local System",   "detected": True,  "severity": "critical"},
            {"id": "T1074.001", "name": "Local Data Staging",       "detected": True,  "severity": "high"},
            {"id": "T1114",     "name": "Email Collection",         "detected": False, "severity": "high"},
            {"id": "T1119",     "name": "Automated Collection",     "detected": True,  "severity": "high"},
        ],
    },
    {
        "id":     "TA0011",
        "tactic": "Command and Control",
        "color":  "#a855f7",
        "techniques": [
            {"id": "T1071.001", "name": "Web Protocols (C2)",       "detected": True,  "severity": "critical"},
            {"id": "T1071.004", "name": "DNS Protocol (C2)",        "detected": True,  "severity": "high"},
            {"id": "T1090.003", "name": "Multi-hop Proxy",          "detected": True,  "severity": "high"},
            {"id": "T1573",     "name": "Encrypted Channel",        "detected": False, "severity": "medium"},
        ],
    },
    {
        "id":     "TA0010",
        "tactic": "Exfiltration",
        "color":  "#f97316",
        "techniques": [
            {"id": "T1567.002", "name": "Exfil to Cloud Storage",   "detected": True,  "severity": "critical"},
            {"id": "T1048.003", "name": "Exfil via DNS",            "detected": True,  "severity": "high"},
            {"id": "T1041",     "name": "Exfil over C2 Channel",    "detected": False, "severity": "high"},
            {"id": "T1030",     "name": "Data Transfer Size Limits","detected": False, "severity": "medium"},
        ],
    },
    {
        "id":     "TA0040",
        "tactic": "Impact",
        "color":  "#FF3B5C",
        "techniques": [
            {"id": "T1486",     "name": "Data Encrypted for Impact","detected": False, "severity": "critical"},
            {"id": "T1490",     "name": "Inhibit System Recovery",  "detected": False, "severity": "critical"},
            {"id": "T1489",     "name": "Service Stop",             "detected": False, "severity": "high"},
            {"id": "T1485",     "name": "Data Destruction",         "detected": False, "severity": "critical"},
        ],
    },
]


@router.get("/matrix")
def get_attack_matrix():
    """Return full MITRE ATT&CK matrix with detection status."""
    total_techniques = sum(len(t["techniques"]) for t in ATTACK_MATRIX)
    detected         = sum(
        sum(1 for tech in t["techniques"] if tech["detected"])
        for t in ATTACK_MATRIX
    )
    coverage_pct = round(detected / total_techniques * 100, 1)

    return {
        "matrix":             ATTACK_MATRIX,
        "tactics_count":      len(ATTACK_MATRIX),
        "total_techniques":   total_techniques,
        "detected_count":     detected,
        "coverage_pct":       coverage_pct,
        "coverage_grade":     ("A" if coverage_pct >= 90 else "B" if coverage_pct >= 75
                               else "C" if coverage_pct >= 60 else "D" if coverage_pct >= 40 else "F"),
        "timestamp":          datetime.now().isoformat(),
    }


@router.get("/coverage")
def get_coverage_summary():
    """Return tactic-level coverage summary."""
    coverage = []
    for tactic in ATTACK_MATRIX:
        techs = tactic["techniques"]
        detected = sum(1 for t in techs if t["detected"])
        coverage.append({
            "tactic":    tactic["tactic"],
            "detected":  detected,
            "total":     len(techs),
            "pct":       round(detected / len(techs) * 100),
            "color":     tactic["color"],
        })
    return {"coverage": coverage}
