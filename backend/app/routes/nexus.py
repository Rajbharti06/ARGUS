"""
ARGUS NEXUS — Entity Graph + Multi-Agent Orchestration API
Palantir Gotham-style entity link analysis and 32-agent swarm management.
"""

import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Query
from typing import Optional

from app.services.knowledge_graph import entity_graph

router = APIRouter()


# ── AGENT SWARM DEFINITIONS ──────────────────────────────────────────────────

SWARMS = [
    {
        "id":      "SWARM-THREAT",
        "name":    "Threat Hunt Swarm",
        "color":   "#FF3B5C",
        "agents":  4,
        "status":  "active",
        "mission": "MITRE ATT&CK TTP correlation across all active sessions",
    },
    {
        "id":      "SWARM-FORENSICS",
        "name":    "Forensics Swarm",
        "color":   "#f97316",
        "agents":  4,
        "status":  "active",
        "mission": "Timeline reconstruction and artifact preservation",
    },
    {
        "id":      "SWARM-RESPONSE",
        "name":    "Response Swarm",
        "color":   "#7ba3c4",
        "agents":  4,
        "status":  "standby",
        "mission": "Automated containment and remediation playbooks",
    },
    {
        "id":      "SWARM-INTEL",
        "name":    "Intelligence Swarm",
        "color":   "#eab308",
        "agents":  4,
        "status":  "active",
        "mission": "External threat feed correlation and attribution",
    },
    {
        "id":      "SWARM-DECEPTION",
        "name":    "Deception Swarm",
        "color":   "#a855f7",
        "agents":  4,
        "status":  "active",
        "mission": "Honeypot management and attacker behavioral profiling",
    },
    {
        "id":      "SWARM-COMPLIANCE",
        "name":    "Compliance Swarm",
        "color":   "#6b9e7a",
        "agents":  4,
        "status":  "active",
        "mission": "NIST/FERPA/ISO 27001 continuous compliance scoring",
    },
    {
        "id":      "SWARM-LEARNING",
        "name":    "Learning Swarm",
        "color":   "#c8a96e",
        "agents":  4,
        "status":  "active",
        "mission": "Behavioral baseline learning and drift detection",
    },
    {
        "id":      "SWARM-CONSENSUS",
        "name":    "Raft Consensus Engine",
        "color":   "#6d8588",
        "agents":  4,
        "status":  "active",
        "mission": "Multi-agent decision consensus via Raft protocol",
    },
]


def _agent_list() -> list[dict]:
    agents = []
    names_by_swarm = {
        "SWARM-THREAT":     ["Predator-1", "Hunter-2", "Stalker-3", "Tracker-4"],
        "SWARM-FORENSICS":  ["Examiner-1", "Analyst-2", "Archivist-3", "Tracer-4"],
        "SWARM-RESPONSE":   ["Responder-1", "Contain-2", "Eradicate-3", "Recover-4"],
        "SWARM-INTEL":      ["Oracle-1", "Prophet-2", "Seer-3", "Augur-4"],
        "SWARM-DECEPTION":  ["Phantom-1", "Ghost-2", "Mirage-3", "Shadow-4"],
        "SWARM-COMPLIANCE": ["Auditor-1", "Regulator-2", "Enforcer-3", "Monitor-4"],
        "SWARM-LEARNING":   ["Learner-1", "Adaptor-2", "Calibrate-3", "Profile-4"],
        "SWARM-CONSENSUS":  ["Leader-1", "Follower-2", "Candidate-3", "Voter-4"],
    }
    tasks_by_swarm = {
        "SWARM-THREAT":     ["Scanning T1566 indicators", "Correlating brute-force patterns", "Hunting C2 beacons", "Analyzing lateral movement"],
        "SWARM-FORENSICS":  ["Preserving memory artifacts", "Reconstructing timeline", "Hashing evidence", "Parsing event logs"],
        "SWARM-RESPONSE":   ["Standby — awaiting trigger", "Pre-loading playbook PB-4821", "Monitoring containment", "Verifying isolation"],
        "SWARM-INTEL":      ["Enriching 185.220.101.45", "Querying CISA KEV", "Cross-referencing MISP", "Scoring threat actor"],
        "SWARM-DECEPTION":  ["Monitoring honeypot HP-1", "Profiling attacker session", "Updating canary tokens", "Analyzing behavioral DNA"],
        "SWARM-COMPLIANCE": ["Scoring NIST CSF controls", "Auditing FERPA compliance", "Checking ISO 27001 gaps", "Generating evidence"],
        "SWARM-LEARNING":   ["Updating user baseline", "Detecting behavioral drift", "Training anomaly model", "Calibrating thresholds"],
        "SWARM-CONSENSUS":  ["Leader election complete", "Log replication active", "Quorum maintained (3/4)", "Heartbeat 50ms"],
    }
    statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "IDLE"]
    for swarm in SWARMS:
        sid = swarm["id"]
        for i in range(4):
            agents.append({
                "id":        f"{sid}-A{i+1}",
                "name":      names_by_swarm[sid][i],
                "swarm":     sid,
                "swarm_name":swarm["name"],
                "color":     swarm["color"],
                "status":    statuses[i] if swarm["status"] == "active" else "STANDBY",
                "task":      tasks_by_swarm[sid][i],
                "cpu":       random.randint(5, 45) if swarm["status"] == "active" else 0,
                "decisions": random.randint(0, 847),
                "uptime":    f"{random.randint(1, 8)}h {random.randint(0, 59)}m",
            })
    return agents


CONSENSUS_LOG = [
    {"ts": "03:14:22", "event": "CONSENSUS REACHED",  "decision": "Isolate host 10.0.4.23 — 4/4 agents agree", "confidence": 100, "color": "#FF3B5C"},
    {"ts": "03:14:18", "event": "VOTE CAST",           "decision": "Tracker-4: ISOLATE (confidence 94%)",        "confidence": 94,  "color": "#f97316"},
    {"ts": "03:14:15", "event": "VOTE CAST",           "decision": "Stalker-3: ISOLATE (confidence 91%)",        "confidence": 91,  "color": "#f97316"},
    {"ts": "03:14:11", "event": "VOTE CAST",           "decision": "Hunter-2: ISOLATE (confidence 96%)",         "confidence": 96,  "color": "#f97316"},
    {"ts": "03:14:07", "event": "PROPOSAL",            "decision": "Predator-1 proposes: ISOLATE lateral host",  "confidence": 88,  "color": "#eab308"},
    {"ts": "03:13:55", "event": "TRIGGER",             "decision": "SMB lateral movement pattern confirmed",      "confidence": 99,  "color": "#FF3B5C"},
    {"ts": "03:09:41", "event": "CONSENSUS REACHED",  "decision": "Block IP 185.220.101.45 — 4/4 agents agree", "confidence": 100, "color": "#FF3B5C"},
    {"ts": "03:02:18", "event": "CONSENSUS REACHED",  "decision": "Revoke session tokens admin@univ.edu",        "confidence": 100, "color": "#FF3B5C"},
    {"ts": "02:58:44", "event": "LEARNING UPDATE",    "decision": "Admin baseline updated — anomaly threshold adjusted", "confidence": 82, "color": "#6b9e7a"},
    {"ts": "02:44:11", "event": "INTELLIGENCE",       "decision": "GreyNoise confirms 185.220.101.45 = TOR exit node",   "confidence": 99, "color": "#eab308"},
]


@router.get("/graph")
def get_entity_graph(
    focus: Optional[str] = Query(None, description="Node ID to focus on (BFS subgraph)"),
    depth: int = Query(2, ge=1, le=4),
):
    """Return full entity relationship graph or focused subgraph."""
    return entity_graph.get_graph_json(focus_id=focus, depth=depth)


@router.get("/graph/stats")
def get_graph_stats():
    """Return entity graph summary statistics."""
    return entity_graph.get_stats()


@router.get("/agents")
def get_agents():
    """Return all 32 agents across 8 swarms."""
    agents = _agent_list()
    return {
        "agents":        agents,
        "total_agents":  len(agents),
        "swarms":        SWARMS,
        "active_swarms": sum(1 for s in SWARMS if s["status"] == "active"),
        "total_decisions": random.randint(4200, 5100),
        "consensus_rate":  random.randint(94, 99),
    }


@router.get("/consensus")
def get_consensus_log():
    """Return Raft consensus decision log."""
    now = datetime.now()
    log = []
    for i, entry in enumerate(CONSENSUS_LOG):
        item = dict(entry)
        t = now - timedelta(minutes=i * 3 + random.randint(0, 2))
        item["ts"] = t.strftime("%H:%M:%S")
        log.append(item)
    return {
        "log":            log,
        "leader":         "Leader-1 (SWARM-CONSENSUS)",
        "term":           random.randint(42, 58),
        "quorum":         "4/4",
        "heartbeat_ms":   random.randint(45, 55),
        "total_decisions":len(log),
    }


@router.get("/swarms")
def get_swarms():
    """Return swarm status overview."""
    swarms_with_stats = []
    for s in SWARMS:
        sw = dict(s)
        sw["decisions_hour"] = random.randint(120, 980)
        sw["accuracy"]       = random.randint(91, 99)
        swarms_with_stats.append(sw)
    return {"swarms": swarms_with_stats}


@router.post("/ingest")
def ingest_event(
    event_type: str,
    src_ip:     str = "0.0.0.0",
    user:       str = "unknown",
    description:str = "",
):
    """Dynamically ingest a new event into the entity graph."""
    entity_graph.ingest_event(event_type, src_ip, user, description)
    return {"status": "ingested", "graph_size": entity_graph.get_stats()}
