"""
ARGUS — Oracle Correlation Engine
Palantir-style: correlates signals across User / IP / Time / Module
into full attack chains with MITRE ATT&CK TTP mapping and kill chain tracking.
"""

import time
import uuid
from collections import deque
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.services.threat_intel import TTP_MAP, KILL_CHAIN_ORDER, get_ttp


# ── Data Models ──────────────────────────────────────────────────────────────

class Signal:
    def __init__(
        self,
        module:      str,
        event:       str,
        severity:    str,
        user:        str = "unknown",
        ip:          str = "0.0.0.0",
        description: str = "",
        ttp:         Optional[dict] = None,
    ):
        self.id          = str(uuid.uuid4())
        self.timestamp   = datetime.now()
        self.module      = module
        self.event       = event
        self.severity    = severity
        self.user        = user
        self.ip          = ip
        self.description = description
        self.ttp         = ttp or get_ttp(event)  # auto-map to ATT&CK TTP


class Incident:
    def __init__(self, title: str, severity: str):
        self.id           = f"INC-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
        self.title        = title
        self.severity     = severity
        self.signals:     List[Signal] = []
        self.created_at   = datetime.now()
        self.updated_at   = datetime.now()
        self.attack_vector = "Unknown"
        self.summary      = ""
        self.ai_summary   = False
        self.kill_chain_phases: List[str] = []
        self.ttps:        List[dict] = []


# ── Severity ordering ─────────────────────────────────────────────────────────

_SEV_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


class OracleEngine:
    """
    Correlates security signals into incidents using:
    - IP-based correlation
    - User-based correlation
    - Time-window correlation (configurable)
    - TTP-based kill chain reconstruction
    - MITRE ATT&CK phase tracking
    """

    def __init__(self, window_minutes: int = 90):
        self.signals   = deque(maxlen=2000)
        self.incidents: Dict[str, Incident] = {}
        self.window_minutes = window_minutes

    # ── Public API ─────────────────────────────────────────────────────────────

    def ingest_signal(
        self,
        module:      str,
        event:       str,
        severity:    str,
        user:        str = "unknown",
        ip:          str = "0.0.0.0",
        description: str = "",
    ) -> Signal:
        """Ingest a new signal; correlate into existing incidents or create new."""
        sig = Signal(module, event, severity, user, ip, description)
        self.signals.append(sig)
        if not self._correlate(sig):
            if severity in ("critical", "high"):
                self._create_incident(sig)
        return sig

    def get_active_incidents(self) -> List[Dict[str, Any]]:
        """Return incidents active within the correlation window, newest first."""
        cutoff = datetime.now() - timedelta(minutes=self.window_minutes)
        active = [i for i in self.incidents.values() if i.updated_at > cutoff]
        active.sort(key=lambda x: x.updated_at, reverse=True)
        return [self._serialize(inc) for inc in active]

    def get_stats(self) -> Dict[str, Any]:
        """Aggregated statistics for the overview dashboard."""
        cutoff = datetime.now() - timedelta(minutes=self.window_minutes)
        active = [i for i in self.incidents.values() if i.updated_at > cutoff]
        return {
            "total_incidents":    len(active),
            "critical_incidents": sum(1 for i in active if i.severity == "critical"),
            "high_incidents":     sum(1 for i in active if i.severity == "high"),
            "total_signals":      len(self.signals),
            "unique_ttps":        len({s.ttp["id"] for s in self.signals if s.ttp}),
        }

    # ── Correlation Logic ──────────────────────────────────────────────────────

    def _correlate(self, signal: Signal) -> bool:
        cutoff = datetime.now() - timedelta(minutes=self.window_minutes)
        for incident in self.incidents.values():
            if incident.updated_at < cutoff:
                continue
            if self._is_related(incident, signal):
                incident.signals.append(signal)
                incident.updated_at = datetime.now()
                if _SEV_RANK.get(signal.severity, 0) > _SEV_RANK.get(incident.severity, 0):
                    incident.severity = signal.severity
                self._rebuild_metadata(incident)
                return True
        return False

    def _is_related(self, incident: Incident, signal: Signal) -> bool:
        """True if signal should be attached to this incident."""
        # Same external IP (most reliable for external threats)
        if signal.ip not in ("0.0.0.0", "unknown") and not signal.ip.startswith(("10.", "192.168.", "127.")):
            if any(s.ip == signal.ip for s in incident.signals):
                return True
        # Same user identity
        if signal.user not in ("unknown",) and any(s.user == signal.user for s in incident.signals):
            return True
        # Same TTP tactic (chain attacks within same kill chain phase)
        if signal.ttp:
            if any(s.ttp and s.ttp.get("tactic") == signal.ttp.get("tactic") for s in incident.signals):
                # Only correlate same-tactic signals if recent (30 min)
                recent_cutoff = datetime.now() - timedelta(minutes=30)
                if any(s.ttp and s.ttp.get("tactic") == signal.ttp.get("tactic")
                       and s.timestamp > recent_cutoff for s in incident.signals):
                    return True
        return False

    def _create_incident(self, signal: Signal) -> Incident:
        ttp_name = signal.ttp["name"] if signal.ttp else signal.event.replace("_", " ").title()
        title = f"Active Threat: {ttp_name}"
        if signal.ttp:
            title = f"[{signal.ttp['id']}] {ttp_name} — {signal.module} Module"
        incident = Incident(title, signal.severity)
        incident.signals.append(signal)
        self._rebuild_metadata(incident)
        self.incidents[incident.id] = incident
        return incident

    def _rebuild_metadata(self, incident: Incident) -> None:
        """Reconstruct attack vector, kill chain phases, and TTP list from signals."""
        ordered = sorted(incident.signals, key=lambda s: s.timestamp)

        # Build attack vector string
        steps = [f"{s.module}:{s.event}" for s in ordered]
        incident.attack_vector = " → ".join(steps)

        # Collect unique TTPs
        seen_ttp_ids = set()
        incident.ttps = []
        for sig in ordered:
            if sig.ttp and sig.ttp["id"] not in seen_ttp_ids:
                seen_ttp_ids.add(sig.ttp["id"])
                incident.ttps.append(sig.ttp)

        # Collect kill chain phases in order
        phases_seen = set()
        incident.kill_chain_phases = []
        for tactic in KILL_CHAIN_ORDER:
            for sig in ordered:
                if sig.ttp and sig.ttp.get("tactic") == tactic and tactic not in phases_seen:
                    incident.kill_chain_phases.append(tactic)
                    phases_seen.add(tactic)

        # Auto-generate summary
        n = len(incident.signals)
        if n == 1:
            incident.summary = incident.signals[0].description
        else:
            phases_str = " → ".join(incident.kill_chain_phases) if incident.kill_chain_phases else incident.attack_vector
            incident.summary = (
                f"Multi-stage attack chain detected across {n} correlated signals. "
                f"Kill chain progression: {phases_str}. "
                f"Severity escalated to {incident.severity.upper()}."
            )

    # ── Serialization ──────────────────────────────────────────────────────────

    def _serialize(self, inc: Incident) -> Dict[str, Any]:
        ordered = sorted(inc.signals, key=lambda s: s.timestamp)
        first   = ordered[0].timestamp if ordered else inc.created_at
        last    = ordered[-1].timestamp if ordered else inc.updated_at
        dwell   = int((last - first).total_seconds() / 60)

        return {
            "incident_id":        inc.id,
            "id":                 inc.id,
            "title":              inc.title,
            "severity":           inc.severity,
            "summary":            inc.summary,
            "ai_powered":         inc.ai_summary,
            "attack_vector":      inc.attack_vector,
            "kill_chain_phases":  inc.kill_chain_phases,
            "ttps":               inc.ttps,
            "signal_count":       len(inc.signals),
            "dwell_time":         f"{dwell} minute{'s' if dwell != 1 else ''}",
            "affected_records":   max(100, len(inc.signals) * 847),
            "created_at":         inc.created_at.isoformat(),
            "updated_at":         inc.updated_at.isoformat(),
            "timeline": [
                {
                    "time":     s.timestamp.strftime("%H:%M:%S"),
                    "event":    s.description or s.event.replace("_", " ").title(),
                    "actor":    f"{s.user}@{s.ip}" if s.ip != "0.0.0.0" else s.user,
                    "severity": s.severity,
                    "module":   s.module,
                    "ttp_id":   s.ttp["id"]   if s.ttp else None,
                    "ttp_name": s.ttp["name"] if s.ttp else None,
                    "tactic":   s.ttp["tactic"] if s.ttp else None,
                }
                for s in ordered
            ],
        }


# ── Global singleton ──────────────────────────────────────────────────────────
oracle_engine = OracleEngine()
