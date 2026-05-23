"""
ARGUS — Palantir-style Entity Knowledge Graph Engine
Builds and queries a live relationship graph between:
  IPs, domains, users, malware families, TTPs, and incidents.
Uses in-memory graph with NetworkX for centrality and path analysis.
"""

import random
from datetime import datetime
from typing import Optional
from collections import defaultdict

# Lightweight graph without networkx dependency
# Using adjacency list representation

class EntityGraph:
    """
    In-memory entity relationship graph.
    Nodes: IP, domain, user, malware, ttp, asset
    Edges: relationship types with confidence and timestamp
    """

    ENTITY_TYPES = {
        "ip":      {"color": "#FF3B5C", "icon": "network"},
        "domain":  {"color": "#f97316", "icon": "globe"},
        "user":    {"color": "#7ba3c4",  "icon": "user"},
        "malware": {"color": "#a855f7", "icon": "bug"},
        "ttp":     {"color": "#eab308", "icon": "target"},
        "asset":   {"color": "#6b9e7a", "icon": "server"},
        "incident":{"color": "#ef4444", "icon": "alert"},
    }

    EDGE_TYPES = {
        "communicates_with": {"color": "#FF3B5C", "dashed": False},
        "resolves_to":       {"color": "#f97316", "dashed": False},
        "authenticated_as":  {"color": "#7ba3c4",  "dashed": False},
        "uses_technique":    {"color": "#eab308", "dashed": True},
        "hosts_malware":     {"color": "#a855f7", "dashed": False},
        "lateral_to":        {"color": "#FF3B5C", "dashed": True},
        "exfil_to":          {"color": "#ef4444", "dashed": False},
        "part_of":           {"color": "#6d8588", "dashed": True},
    }

    def __init__(self):
        self.nodes: dict[str, dict] = {}
        self.edges: list[dict] = []
        self._edge_set: set = set()
        self._seed_graph()

    def _add_node(self, node_id: str, label: str, etype: str, **kwargs):
        if node_id not in self.nodes:
            meta = self.ENTITY_TYPES.get(etype, {})
            self.nodes[node_id] = {
                "id":        node_id,
                "label":     label,
                "type":      etype,
                "color":     meta.get("color", "#6d8588"),
                "icon":      meta.get("icon", "circle"),
                "risk":      kwargs.get("risk", "low"),
                "first_seen":kwargs.get("first_seen", datetime.now().strftime("%Y-%m-%d")),
                "last_seen": kwargs.get("last_seen", datetime.now().strftime("%H:%M:%S")),
                "hits":      kwargs.get("hits", 1),
                **{k: v for k, v in kwargs.items() if k not in ("risk","first_seen","last_seen","hits")},
            }

    def _add_edge(self, src: str, dst: str, rel: str, confidence: int = 85, **kwargs):
        key = f"{src}→{rel}→{dst}"
        if key in self._edge_set:
            return
        self._edge_set.add(key)
        meta = self.EDGE_TYPES.get(rel, {})
        self.edges.append({
            "source":     src,
            "target":     dst,
            "relation":   rel,
            "confidence": confidence,
            "color":      meta.get("color", "#6d8588"),
            "dashed":     meta.get("dashed", False),
            **kwargs,
        })

    def _seed_graph(self):
        """Seed with a realistic APT attack graph (pre-built from ARGUS incidents)."""
        # --- Threat Actors / IPs ---
        self._add_node("ip_185_220", "185.220.101.45", "ip", risk="critical",
                       country="Russia", asn="AS60729", reputation="TOR exit node / Brute-force source",
                       abuse_score=97, hits=847)
        self._add_node("ip_203_45",  "203.45.12.88",   "ip", risk="high",
                       country="China",  asn="AS4134",  reputation="State-sponsored APT infrastructure",
                       abuse_score=72, hits=23)
        self._add_node("ip_94_102",  "94.102.49.190",  "ip", risk="critical",
                       country="Ukraine", asn="AS29182", reputation="Credential stuffing botnet node",
                       abuse_score=91, hits=847)
        self._add_node("ip_exfil",   "185.220.101.14", "ip", risk="critical",
                       country="Romania", asn="AS60729", reputation="Exfiltration endpoint — domain 48h old",
                       abuse_score=99, hits=3)

        # --- Domains ---
        self._add_node("dom_sso",    "login-univ-sso.xyz", "domain", risk="critical",
                       registered="2026-05-21", registrar="Namecheap", resolved_to="185.220.101.45",
                       category="AiTM phishing kit — SSO credential harvesting")
        self._add_node("dom_c2",     "update-mgmt.click",  "domain", risk="critical",
                       registered="2026-05-18", registrar="GoDaddy", resolved_to="94.102.49.190",
                       category="C2 infrastructure — beaconing every 30s detected")
        self._add_node("dom_exfil",  "backup-sync-s3.tk",  "domain", risk="critical",
                       registered="2026-05-22", registrar="Freenom", resolved_to="185.220.101.14",
                       category="Exfiltration staging — 2.4 GB transferred")

        # --- Users ---
        self._add_node("usr_admin",  "admin@univ.edu",    "user", risk="critical",
                       department="IT Admin", mfa="Push (bypassed)", last_login="2026-05-22 03:14",
                       sessions=3, compromised=True)
        self._add_node("usr_prof",   "prof.johnson@univ.edu", "user", risk="high",
                       department="Research", mfa="SMS", last_login="2026-05-22 01:07")
        self._add_node("usr_svc",    "svc_account",       "user", risk="high",
                       department="System", mfa="None", last_login="2026-05-22 03:14",
                       note="Midnight admin access — no change ticket")
        self._add_node("usr_dev",    "devops_team",       "user", risk="medium",
                       department="DevOps", mfa="TOTP",
                       note="AWS key committed to public repo")

        # --- Assets ---
        self._add_node("asset_db",   "rds-university-prod", "asset", risk="critical",
                       type="Database", port=5432, public=True, records=18421)
        self._add_node("asset_s3",   "s3://univ-research-data", "asset", risk="critical",
                       type="S3 Bucket", acl="public-read", records=18421)
        self._add_node("asset_host1","10.0.4.23", "asset", risk="critical",
                       type="Internal Host", os="Windows Server 2022")
        self._add_node("asset_host2","10.0.4.31", "asset", risk="high",
                       type="Internal Host", os="Ubuntu 22.04")

        # --- Malware ---
        self._add_node("mal_aitm",   "Evilginx2 AiTM Kit", "malware", risk="critical",
                       family="AiTM Phishing Framework", first_seen="2026-05-22",
                       c2="update-mgmt.click", sessions_captured=12)
        self._add_node("mal_rat",    "Cobalt Strike Beacon", "malware", risk="critical",
                       family="RAT/C2 Framework", beacon_interval="30s",
                       sleep_jitter="20%")

        # --- TTPs ---
        self._add_node("ttp_t1566",  "T1566.001 Spear Phishing", "ttp",
                       tactic="Initial Access", mitre_url="https://attack.mitre.org/techniques/T1566/001/")
        self._add_node("ttp_t1078",  "T1078 Valid Accounts",     "ttp",
                       tactic="Defense Evasion")
        self._add_node("ttp_t1550",  "T1550.001 Pass the Cookie","ttp",
                       tactic="Defense Evasion")
        self._add_node("ttp_t1021",  "T1021.002 SMB Shares",     "ttp",
                       tactic="Lateral Movement")
        self._add_node("ttp_t1567",  "T1567.002 Cloud Exfil",    "ttp",
                       tactic="Exfiltration")

        # --- Incident ---
        self._add_node("inc_001",    "INC-20240441",              "incident",
                       title="APT Multi-Stage Compromise", severity="critical",
                       dwell="47 minutes", affected_records=18421)

        # --- Edges (attack chain) ---
        self._add_edge("ip_185_220", "dom_sso",    "resolves_to",     99)
        self._add_edge("dom_sso",    "mal_aitm",   "hosts_malware",   95)
        self._add_edge("mal_aitm",   "usr_admin",  "authenticated_as",91, note="AiTM session token harvested")
        self._add_edge("ip_185_220", "usr_admin",  "communicates_with",87)
        self._add_edge("usr_admin",  "asset_db",   "communicates_with",90, note="Bulk export 18,421 records")
        self._add_edge("asset_db",   "dom_exfil",  "exfil_to",        99, note="2.4 GB via HTTPS")
        self._add_edge("ip_exfil",   "dom_exfil",  "resolves_to",     99)
        self._add_edge("usr_admin",  "asset_host1","lateral_to",      88, note="SMB Admin Shares")
        self._add_edge("asset_host1","asset_host2","lateral_to",      82)
        self._add_edge("asset_host1","mal_rat",    "hosts_malware",   85, note="Beacon implanted")
        self._add_edge("mal_rat",    "dom_c2",     "communicates_with",94, note="30s beacon interval")
        self._add_edge("ip_94_102",  "dom_c2",     "resolves_to",     91)
        self._add_edge("ip_185_220", "ttp_t1566",  "uses_technique",  95)
        self._add_edge("usr_admin",  "ttp_t1078",  "uses_technique",  90)
        self._add_edge("mal_aitm",   "ttp_t1550",  "uses_technique",  93)
        self._add_edge("asset_host1","ttp_t1021",  "uses_technique",  88)
        self._add_edge("dom_exfil",  "ttp_t1567",  "uses_technique",  99)
        self._add_edge("inc_001",    "ip_185_220", "part_of",         99)
        self._add_edge("inc_001",    "usr_admin",  "part_of",         99)
        self._add_edge("ip_203_45",  "usr_prof",   "communicates_with",72, note="Impossible travel — Beijing login")
        self._add_edge("usr_dev",    "asset_s3",   "communicates_with",80, note="API key leak — public GitHub")

    def get_graph_json(self, focus_id: Optional[str] = None, depth: int = 2) -> dict:
        """Return graph as JSON for visualization. Optionally BFS from a focus node."""
        if focus_id and focus_id in self.nodes:
            # BFS from focus node up to depth hops
            visited = {focus_id}
            frontier = {focus_id}
            for _ in range(depth):
                next_frontier = set()
                for nid in frontier:
                    for edge in self.edges:
                        if edge["source"] == nid and edge["target"] not in visited:
                            next_frontier.add(edge["target"])
                            visited.add(edge["target"])
                        elif edge["target"] == nid and edge["source"] not in visited:
                            next_frontier.add(edge["source"])
                            visited.add(edge["source"])
                frontier = next_frontier

            nodes = [v for k, v in self.nodes.items() if k in visited]
            edges = [e for e in self.edges if e["source"] in visited and e["target"] in visited]
        else:
            nodes = list(self.nodes.values())
            edges = self.edges

        # Compute centrality (degree)
        degree: dict[str, int] = defaultdict(int)
        for e in edges:
            degree[e["source"]] += 1
            degree[e["target"]] += 1

        nodes_out = []
        for n in nodes:
            node_copy = dict(n)
            node_copy["degree"] = degree.get(n["id"], 0)
            node_copy["size"]   = 8 + degree.get(n["id"], 0) * 3
            nodes_out.append(node_copy)

        return {
            "nodes":       nodes_out,
            "edges":       edges,
            "node_count":  len(nodes_out),
            "edge_count":  len(edges),
            "focus":       focus_id,
        }

    def ingest_event(self, event_type: str, src_ip: str, user: str, description: str):
        """Dynamically ingest a new security event into the graph."""
        node_id = f"dyn_ip_{src_ip.replace('.', '_')}"
        self._add_node(node_id, src_ip, "ip", risk="high", country="Unknown",
                       hits=1, first_seen=datetime.now().strftime("%Y-%m-%d"))

        user_id = f"dyn_usr_{user.replace('@', '_').replace('.', '_')}"
        self._add_node(user_id, user, "user", risk="high")

        rel = "communicates_with"
        if "lateral" in event_type:
            rel = "lateral_to"
        elif "exfil" in event_type:
            rel = "exfil_to"
        elif "phishing" in event_type:
            rel = "authenticated_as"

        self._add_edge(node_id, user_id, rel, 70, note=description[:80])

    def get_stats(self) -> dict:
        risk_counts = defaultdict(int)
        type_counts = defaultdict(int)
        for n in self.nodes.values():
            risk_counts[n.get("risk", "low")] += 1
            type_counts[n.get("type", "unknown")] += 1

        return {
            "total_entities":  len(self.nodes),
            "total_relations": len(self.edges),
            "critical_nodes":  risk_counts.get("critical", 0),
            "high_nodes":      risk_counts.get("high", 0),
            "entity_breakdown": dict(type_counts),
            "risk_breakdown":   dict(risk_counts),
        }


# Singleton instance shared across requests
entity_graph = EntityGraph()
