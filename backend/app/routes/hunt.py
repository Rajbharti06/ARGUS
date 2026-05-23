"""
ARGUS HUNT — Proactive Threat Hunting API
YARA-style pattern engine + MITRE ATT&CK kill-chain hunting.
"""

from fastapi import APIRouter, Query
from typing import Optional

from app.services.hunt_engine import run_hunt_scan, HUNT_RULES

router = APIRouter()


@router.get("/scan")
def hunt_scan(rule_ids: Optional[str] = Query(None, description="Comma-separated rule IDs to filter")):
    """Execute threat hunt scan across all rules."""
    ids = [r.strip() for r in rule_ids.split(",")] if rule_ids else None
    return run_hunt_scan(rule_ids=ids)


@router.get("/rules")
def list_rules():
    """Return all available hunt rules."""
    return {
        "rules":       HUNT_RULES,
        "total":       len(HUNT_RULES),
        "tactics_covered": list({r["tactic"] for r in HUNT_RULES}),
    }
