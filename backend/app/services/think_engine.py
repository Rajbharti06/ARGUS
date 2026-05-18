"""
ARGUS — Think Engine (Palantir-Grade Intelligence Pipeline)
Ported from The Orchestrator's JS intelligence modules into Python.

5 Intelligence Primitives:
  THINK   → Adaptive Graph of Thoughts (AGoT, arXiv:2502.05078) +46.2% GPQA
  RELATE  → Palantir i2 ELP entity-link-property graph + "search around" BFS
  SUGGEST → DARPA KAIROS schema-matching + abductive ranked hypotheses
  EXECUTE → A2P causal planning: Abduct → Act → Predict (arXiv:2509.10401)
  PRESENT → IC Analytic Standards: BLUF + key judgments + evidence chains

Knowledge persistence:
  memory/argus_kg.json     — entity knowledge graph (HippoRAG 2-style)
  memory/argus_ontology.json — entity-link registry (Palantir ontology)
  memory/argus_causal.json   — causal graph (A2P + CRAwDAD)
"""

import json
import math
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from app.core.config import settings
from app.core.logging import logger
from app.services.ai_router import AIRouter, best_available_router

# ── Memory paths ──────────────────────────────────────────────────────────────

_MEM_DIR = Path(__file__).parent.parent.parent.parent / "memory"
_MEM_DIR.mkdir(exist_ok=True)

_KG_PATH       = _MEM_DIR / "argus_kg.json"
_ONTOLOGY_PATH = _MEM_DIR / "argus_ontology.json"
_CAUSAL_PATH   = _MEM_DIR / "argus_causal.json"


def _load(path: Path, default: dict) -> dict:
    try:
        if path.exists():
            return json.loads(path.read_text())
    except Exception:
        pass
    return default


def _save(path: Path, data: dict) -> None:
    try:
        path.write_text(json.dumps(data, indent=2, default=str))
    except Exception:
        pass


# In-memory state (loaded once, saved on write)
_kg: dict = _load(_KG_PATH, {"triples": [], "entities": {}, "communities": []})
_ontology: dict = _load(_ONTOLOGY_PATH, {"entities": {}, "links": [], "stats": {"entities": 0, "links": 0}})
_causal: dict = _load(_CAUSAL_PATH, {"nodes": {}, "edges": [], "counterfactuals": []})

# ── LLM helper ────────────────────────────────────────────────────────────────

REASONING_MODELS = {
    "reasoning": settings.FEATHERLESS_MODEL_SEC,  # Foundation-Sec-8B for security reasoning
    "fast":      settings.FEATHERLESS_MODEL_FAST,  # GLM-5.1 for fast ops
    "default":   settings.FEATHERLESS_MODEL,       # Qwen3.6-35B for structured output
}


async def _llm(prompt: str, task: str = "default", max_tokens: int = 800) -> str:
    """Call LLM and return raw string response."""
    router = AIRouter(
        provider="featherless",
        api_key=settings.FEATHERLESS_API_KEY,
        model=REASONING_MODELS.get(task, settings.FEATHERLESS_MODEL),
    )
    try:
        return await router.agenerate(prompt)
    except Exception as exc:
        logger.warning(f"ThinkEngine LLM error: {exc}")
        return ""


def _extract_json(text: str) -> dict:
    """Extract first JSON object from LLM output."""
    try:
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            return json.loads(m.group())
    except Exception:
        pass
    return {}


# ═══════════════════════════════════════════════════════════════════════════
# PRIMITIVE 1 — THINK (Adaptive Graph of Thoughts)
# ═══════════════════════════════════════════════════════════════════════════

async def think(question: str, context: str = "", max_depth: int = 3) -> dict:
    """
    AGoT-style recursive reasoning DAG.
    Only expands nodes where confidence is low — avoids over-thinking simple nodes.
    +46.2% GPQA vs standard CoT (arXiv:2502.05078).
    """
    nodes: dict[str, dict] = {}

    async def reason_node(q: str, depth: int, parent_reasoning: str = "") -> str:
        node_id = str(uuid.uuid4())[:8]

        prompt = f"""You are a cybersecurity intelligence analyst using systematic reasoning.

Question: {q}
Context: {context[:1200] if context else "None"}
{f"Parent reasoning: {parent_reasoning[:400]}" if parent_reasoning else ""}

Reason step-by-step. Identify:
1. What you know with HIGH confidence
2. What requires more investigation (LOW confidence)
3. Your conclusion

Return JSON:
{{
  "reasoning": "step-by-step analysis",
  "conclusion": "your answer to the question",
  "confidence": 0.0-1.0,
  "uncertainties": ["things you're unsure about"],
  "needsExpansion": true/false
}}"""

        raw = await _llm(prompt, task="reasoning", max_tokens=500)
        result = _extract_json(raw)

        nodes[node_id] = {
            "id": node_id,
            "question": q,
            "reasoning": result.get("reasoning", ""),
            "conclusion": result.get("conclusion", ""),
            "confidence": result.get("confidence", 0.5),
            "needsExpansion": result.get("needsExpansion", False),
            "uncertainties": result.get("uncertainties", []),
            "depth": depth,
            "children": [],
        }

        # AGoT: only expand if uncertain and haven't hit max depth
        if result.get("needsExpansion") and depth < max_depth and result.get("confidence", 1.0) < 0.75:
            decomp_prompt = f"""Break this question into 2-3 focused sub-questions that together answer it:
Question: {q}
Return JSON: {{"subquestions": ["sub1", "sub2"]}}"""
            decomp_raw = await _llm(decomp_prompt, task="fast", max_tokens=200)
            decomp = _extract_json(decomp_raw)
            for sub in (decomp.get("subquestions") or [])[:3]:
                child_id = await reason_node(sub, depth + 1, result.get("reasoning", ""))
                nodes[node_id]["children"].append(child_id)

        return node_id

    root_id = await reason_node(question, 0)

    # Synthesize all leaf conclusions
    leaves = [n for n in nodes.values() if not n["children"]]
    if len(leaves) > 1:
        leaf_text = "\n".join(f"- {n['conclusion']} (conf: {n['confidence']:.0%})" for n in leaves)
        synth_prompt = f"""Synthesize these reasoning conclusions into one final answer:
{leaf_text}
Original question: {question}
Return JSON: {{"synthesis": "final answer", "confidence": 0.0-1.0, "keyInsights": ["insight1"]}}"""
        synth_raw = await _llm(synth_prompt, task="reasoning", max_tokens=400)
        synthesis = _extract_json(synth_raw)
    else:
        root = nodes.get(root_id, {})
        synthesis = {"synthesis": root.get("conclusion", ""), "confidence": root.get("confidence", 0.5), "keyInsights": []}

    return {
        "question": question,
        "synthesis": synthesis.get("synthesis", ""),
        "confidence": synthesis.get("confidence", 0.5),
        "keyInsights": synthesis.get("keyInsights", []),
        "nodes": len(nodes),
        "depth": max_depth,
        "reasoningTree": nodes,
    }


# ═══════════════════════════════════════════════════════════════════════════
# PRIMITIVE 2 — RELATE (Palantir Entity-Link-Property Graph)
# ═══════════════════════════════════════════════════════════════════════════

ENTITY_TYPES = {"person", "org", "event", "artifact", "location", "threat", "concept", "action", "ip", "cve"}


async def relate(text: str, source: str = None) -> dict:
    """
    Extract typed entities and their relationships using i2 ELP methodology.
    Stores in persistent ontology for future "search around" BFS traversal.
    """
    prompt = f"""You are a Palantir-style intelligence analyst using i2 ELP methodology.
Extract ALL named entities and their relationships from this text.

Text: {text[:2000]}

Entity types: person, org, event, artifact, location, threat, concept, action, ip, cve

Return JSON:
{{
  "entities": [
    {{"name": "entity name", "type": "entity_type", "properties": {{}}, "confidence": 0.0-1.0}}
  ],
  "links": [
    {{"from": "entity name", "to": "entity name", "relation": "relationship verb", "confidence": 0.0-1.0, "evidence": "quote"}}
  ]
}}"""

    raw = await _llm(prompt, task="default", max_tokens=800)
    result = _extract_json(raw)

    entities = result.get("entities", [])
    links = result.get("links", [])
    now = datetime.utcnow().isoformat()

    # Persist to ontology
    for ent in entities:
        if not ent.get("name"):
            continue
        ent_id = f"{ent['type']}-{ent['name'].lower().replace(' ', '-')}"
        if ent_id not in _ontology["entities"]:
            _ontology["entities"][ent_id] = {
                "id": ent_id,
                "name": ent["name"],
                "type": ent.get("type", "concept"),
                "properties": ent.get("properties", {}),
                "confidence": ent.get("confidence", 0.7),
                "source": source,
                "createdAt": now,
            }
            _ontology["stats"]["entities"] += 1
        else:
            _ontology["entities"][ent_id]["confidence"] = max(
                _ontology["entities"][ent_id]["confidence"],
                ent.get("confidence", 0.7),
            )

    for link in links:
        if not (link.get("from") and link.get("to")):
            continue
        from_id = next((eid for eid, e in _ontology["entities"].items() if e["name"] == link["from"]), None)
        to_id   = next((eid for eid, e in _ontology["entities"].items() if e["name"] == link["to"]),   None)
        if from_id and to_id:
            _ontology["links"].append({
                "id": str(uuid.uuid4()),
                "from": from_id,
                "to": to_id,
                "relation": link.get("relation", "related-to"),
                "confidence": link.get("confidence", 0.7),
                "evidence": link.get("evidence", ""),
                "source": source,
                "timestamp": now,
            })
            _ontology["stats"]["links"] += 1

    _save(_ONTOLOGY_PATH, _ontology)

    # "Search around" BFS for each entity (Palantir core primitive)
    connections = {}
    for ent in entities[:5]:  # limit to top 5 to avoid slowdowns
        ent_id = f"{ent['type']}-{ent['name'].lower().replace(' ', '-')}"
        connections[ent["name"]] = _search_around(ent_id, max_hops=2)

    return {
        "entities": entities,
        "links": links,
        "connections": connections,
        "ontologySize": _ontology["stats"],
    }


def _search_around(entity_id: str, max_hops: int = 2) -> list[dict]:
    """BFS over the ontology to find indirect connections (Palantir's core intelligence primitive)."""
    visited = {entity_id}
    queue = [{"id": entity_id, "hop": 0, "path": []}]
    connected = []

    while queue:
        item = queue.pop(0)
        if item["hop"] >= max_hops:
            continue

        out_links = [l for l in _ontology["links"] if l["from"] == item["id"]]
        for link in out_links:
            if link["to"] in visited:
                continue
            visited.add(link["to"])
            target = _ontology["entities"].get(link["to"])
            if not target:
                continue

            path_step = {
                "entity": _ontology["entities"].get(item["id"], {}).get("name", item["id"]),
                "via": link["relation"],
                "confidence": link["confidence"],
            }
            connected.append({
                "entity": target["name"],
                "type": target["type"],
                "hop": item["hop"] + 1,
                "via": link["relation"],
                "path": item["path"] + [path_step],
            })
            queue.append({"id": link["to"], "hop": item["hop"] + 1, "path": item["path"] + [path_step]})

    return connected


# ═══════════════════════════════════════════════════════════════════════════
# PRIMITIVE 3 — SUGGEST (DARPA KAIROS + Abductive Hypotheses)
# ═══════════════════════════════════════════════════════════════════════════

THREAT_SCHEMAS = [
    "supply-chain-attack", "ransomware-campaign", "credential-stuffing",
    "insider-threat", "phishing-campaign", "apt-intrusion", "data-exfiltration",
    "lateral-movement", "privilege-escalation", "denial-of-service",
    "academic-espionage", "financial-fraud", "vulnerability-exploitation",
]


async def suggest(situation: str, context: str = "", think_result: dict = None) -> dict:
    """
    DARPA KAIROS schema-matching + abductive inference.
    Classifies the event type and generates ranked hypotheses with evidence chains.
    """
    think_insight = think_result.get("synthesis", "") if think_result else ""

    schema_prompt = f"""You are a DARPA KAIROS-trained threat analyst.
Classify this security situation into the most matching threat schema.

Situation: {situation[:1500]}
{f"Analysis context: {think_insight[:400]}" if think_insight else ""}

Threat schemas: {", ".join(THREAT_SCHEMAS)}

Return JSON:
{{
  "schema": "best matching schema name",
  "schemaConfidence": 0.0-1.0,
  "schemaRationale": "why this schema matches",
  "missingIndicators": ["expected IOCs not yet seen"]
}}"""

    schema_raw = await _llm(schema_prompt, task="reasoning", max_tokens=400)
    schema_result = _extract_json(schema_raw)

    hyp_prompt = f"""You are an abductive reasoning intelligence analyst.
Generate 3 ranked hypotheses explaining this security situation.

Situation: {situation[:1500]}
Context: {context[:800]}
Threat schema: {schema_result.get("schema", "unknown")}
{f"Reasoning: {think_insight[:400]}" if think_insight else ""}

For each hypothesis, include:
- Evidence that supports it
- Evidence that contradicts it
- Predicted indicators if this hypothesis is true
- How to verify/falsify it

Return JSON:
{{
  "hypotheses": [
    {{
      "rank": 1,
      "hypothesis": "specific explanation of what is happening",
      "confidence": 0.0-1.0,
      "evidence": ["supporting evidence"],
      "counterEvidence": ["contradicting evidence"],
      "predictedIndicators": ["what we should see if true"],
      "actionToVerify": "how to confirm or rule out this hypothesis",
      "threatActor": "likely actor if known"
    }}
  ]
}}"""

    hyp_raw = await _llm(hyp_prompt, task="reasoning", max_tokens=900)
    hyp_result = _extract_json(hyp_raw)

    return {
        "schema": schema_result.get("schema", "unknown"),
        "schemaConfidence": schema_result.get("schemaConfidence", 0.5),
        "schemaRationale": schema_result.get("schemaRationale", ""),
        "missingIndicators": schema_result.get("missingIndicators", []),
        "hypotheses": hyp_result.get("hypotheses", []),
    }


# ═══════════════════════════════════════════════════════════════════════════
# PRIMITIVE 4 — EXECUTE (A2P Causal Planning: Abduct → Act → Predict)
# ═══════════════════════════════════════════════════════════════════════════

async def execute(situation: str, goal: str, context: str = "") -> dict:
    """
    A2P causal planning scaffolding (arXiv:2509.10401).
    Abduct hidden root causes → Act with minimal interventions → Predict counterfactual trajectories.
    """
    # Step 1: ABDUCT
    abduct_prompt = f"""You are a root-cause analyst using abductive inference.

Situation: {situation[:1200]}
Goal: {goal}

ABDUCT: What are the most likely hidden root causes?

Return JSON:
{{
  "rootCauses": ["cause1", "cause2"],
  "hiddenFactors": ["latent factor 1"],
  "confidence": 0.0-1.0,
  "reasoning": "why these are the root causes"
}}"""

    abduct_raw = await _llm(abduct_prompt, task="reasoning", max_tokens=400)
    abduction = _extract_json(abduct_raw)

    # Step 2: ACT
    act_prompt = f"""You are a cyber incident response planner.

Situation: {situation[:1200]}
Goal: {goal}
Root causes: {json.dumps(abduction.get("rootCauses", []))}

ACT: Design minimal, targeted interventions that address root causes.

Return JSON:
{{
  "actions": [
    {{
      "action": "specific technical action",
      "targetsCause": "which root cause",
      "mechanism": "how this stops the threat",
      "priority": 1-10,
      "effort": "immediate|hours|days",
      "sideEffects": ["possible impact on operations"]
    }}
  ],
  "strategy": "overall response approach"
}}"""

    act_raw = await _llm(act_prompt, task="reasoning", max_tokens=600)
    act_result = _extract_json(act_raw)

    # Step 3: PREDICT
    actions_text = "; ".join(a["action"] for a in (act_result.get("actions") or [])[:4])
    predict_prompt = f"""You are a threat trajectory predictor.

Situation: {situation[:800]}
Goal: {goal}
Planned actions: {actions_text}

PREDICT: Simulate what happens after these interventions.

Return JSON:
{{
  "immediateEffects": ["effect in minutes/hours"],
  "secondOrderEffects": ["downstream effects in days"],
  "goalAchievement": 0.0-1.0,
  "failureModes": [
    {{"scenario": "what could go wrong", "probability": 0.0-1.0, "mitigation": "how to prevent"}}
  ],
  "withoutIntervention": "what happens if we do nothing",
  "causalNarrative": "step-by-step story from action to outcome"
}}"""

    predict_raw = await _llm(predict_prompt, task="reasoning", max_tokens=600)
    prediction = _extract_json(predict_raw)

    return {
        "abduction": abduction,
        "actions": act_result.get("actions", []),
        "strategy": act_result.get("strategy", ""),
        "prediction": prediction,
        "goalAchievement": prediction.get("goalAchievement", 0.5),
        "causalNarrative": prediction.get("causalNarrative", ""),
    }


# ═══════════════════════════════════════════════════════════════════════════
# PRIMITIVE 5 — PRESENT (IC Analytic Standards: BLUF + Key Judgments)
# ═══════════════════════════════════════════════════════════════════════════

async def present(
    question: str,
    think_result: dict = None,
    relate_result: dict = None,
    suggest_result: dict = None,
    execute_result: dict = None,
) -> dict:
    """
    Intelligence Community Analytic Standards (NSA/CIA format).
    BLUF + Key Judgments with confidence levels + Evidence chains + Full report.
    """
    synthesis = (think_result or {}).get("synthesis", "")
    top_hyp   = ((suggest_result or {}).get("hypotheses") or [{}])[0]
    schema    = (suggest_result or {}).get("schema", "unknown")
    top_action = ((execute_result or {}).get("actions") or [{}])[0]
    entities  = (relate_result or {}).get("entities", [])

    present_prompt = f"""You are an Intelligence Community analyst producing a classified intelligence report.

Question/Situation: {question[:800]}
Analysis synthesis: {synthesis[:600]}
Top hypothesis: {json.dumps(top_hyp)}
Threat schema: {schema}
Recommended action: {json.dumps(top_action)}
Key entities: {", ".join(e["name"] for e in entities[:8])}

Produce an IC-format intelligence report.

Return JSON:
{{
  "bluf": "BOTTOM LINE UP FRONT — one decisive sentence",
  "classification": "UNCLASSIFIED//FOR OFFICIAL USE ONLY",
  "keyJudgments": [
    {{
      "judgment": "specific intelligence judgment",
      "confidence": "HIGH|MEDIUM|LOW",
      "rationale": "why this level of confidence"
    }}
  ],
  "evidenceChains": [
    {{
      "claim": "what we assess",
      "evidence": ["evidence item 1", "evidence item 2"],
      "reliability": "HIGH|MEDIUM|LOW"
    }}
  ],
  "intelligenceGaps": ["what we don't know that matters"],
  "immediateRecommendations": ["action to take now"],
  "reportDate": "{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}"
}}"""

    raw = await _llm(present_prompt, task="reasoning", max_tokens=900)
    result = _extract_json(raw)

    # Build full markdown report
    bluf = result.get("bluf", synthesis[:200] or "Assessment pending.")
    judgments = result.get("keyJudgments", [])
    evidence  = result.get("evidenceChains", [])
    gaps      = result.get("intelligenceGaps", [])
    recs      = result.get("immediateRecommendations", [])

    md_lines = [
        f"# ARGUS INTELLIGENCE REPORT",
        f"**{result.get('classification', 'UNCLASSIFIED//FOUO')}**  ",
        f"**Date:** {result.get('reportDate', datetime.utcnow().isoformat())}",
        "",
        "## BOTTOM LINE UP FRONT",
        f"> {bluf}",
        "",
        "## KEY JUDGMENTS",
    ]
    for j in judgments:
        md_lines.append(f"- **[{j.get('confidence','?')}]** {j.get('judgment','')}  \n  *{j.get('rationale','')}*")

    md_lines += ["", "## EVIDENCE CHAINS"]
    for e in evidence:
        md_lines.append(f"**{e.get('claim','')}** (reliability: {e.get('reliability','?')})")
        for ev in e.get("evidence", []):
            md_lines.append(f"  - {ev}")

    md_lines += ["", "## INTELLIGENCE GAPS"]
    for g in gaps:
        md_lines.append(f"- {g}")

    md_lines += ["", "## IMMEDIATE RECOMMENDATIONS"]
    for r in recs:
        md_lines.append(f"1. {r}")

    return {
        "bluf": bluf,
        "keyJudgments": judgments,
        "evidenceChains": evidence,
        "intelligenceGaps": gaps,
        "immediateRecommendations": recs,
        "classification": result.get("classification", "UNCLASSIFIED//FOUO"),
        "reportDate": result.get("reportDate", datetime.utcnow().isoformat()),
        "markdownReport": "\n".join(md_lines),
    }


# ═══════════════════════════════════════════════════════════════════════════
# FULL PIPELINE — run all 5 primitives in sequence
# ═══════════════════════════════════════════════════════════════════════════

async def run_intelligence_pipeline(
    question: str,
    context: str = "",
    goal: str = "",
    skip_execute: bool = False,
) -> dict:
    """
    Full THINK → RELATE → SUGGEST → EXECUTE → PRESENT pipeline.
    Returns complete intelligence report.
    """
    logger.info(f"[ThinkEngine] Starting pipeline for: {question[:80]}")

    think_result   = await think(question, context)
    relate_result  = await relate(f"{question}\n\n{context[:800]}", source="pipeline")
    suggest_result = await suggest(question, context, think_result)
    execute_result = (
        await execute(question, goal or question, context)
        if not skip_execute else {}
    )
    present_result = await present(
        question, think_result, relate_result, suggest_result, execute_result
    )

    return {
        "question": question,
        "timestamp": datetime.utcnow().isoformat(),
        "think":   think_result,
        "relate":  relate_result,
        "suggest": suggest_result,
        "execute": execute_result,
        "present": present_result,
        # Convenience top-level fields
        "bluf":    present_result.get("bluf", ""),
        "schema":  suggest_result.get("schema", ""),
        "topHypothesis": (suggest_result.get("hypotheses") or [{}])[0],
        "topAction": (execute_result.get("actions") or [{}])[0] if execute_result else {},
        "markdownReport": present_result.get("markdownReport", ""),
        "confidence": think_result.get("confidence", 0.5),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Knowledge Graph helpers (HippoRAG 2-style PPR retrieval)
# ═══════════════════════════════════════════════════════════════════════════

def add_triple(subject: str, predicate: str, obj: str, confidence: float = 0.8, source: str = None) -> dict:
    """Add a knowledge triple to the ARGUS KG."""
    now = datetime.utcnow().isoformat()
    triple = {
        "id": f"{subject}-{predicate}-{obj}-{int(datetime.utcnow().timestamp())}",
        "subject": subject, "predicate": predicate, "object": obj,
        "confidence": confidence, "source": source, "timestamp": now, "active": True,
    }
    # Contradiction resolution: supersede older contradictory facts
    for t in _kg["triples"]:
        if t["subject"] == subject and t["predicate"] == predicate and t["object"] != obj and t.get("active"):
            if confidence >= t["confidence"]:
                t["active"] = False
                t["supersededBy"] = triple["id"]
    _kg["triples"].append(triple)

    for ent in [subject, obj]:
        if ent not in _kg["entities"]:
            _kg["entities"][ent] = {"mentions": 0, "aliases": []}
        _kg["entities"][ent]["mentions"] += 1

    _save(_KG_PATH, _kg)
    return triple


def get_kg_stats() -> dict:
    return {
        "totalTriples":  len(_kg["triples"]),
        "activeTriples": sum(1 for t in _kg["triples"] if t.get("active", True)),
        "entities":      len(_kg["entities"]),
        "communities":   len(_kg.get("communities", [])),
        "ontologyEntities": _ontology["stats"]["entities"],
        "ontologyLinks":    _ontology["stats"]["links"],
    }


def get_ontology_summary() -> dict:
    type_counts: dict[str, int] = {}
    for e in _ontology["entities"].values():
        t = e.get("type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
    top_entities = sorted(
        _ontology["entities"].values(),
        key=lambda e: e.get("confidence", 0),
        reverse=True,
    )[:10]
    return {
        "typeCounts": type_counts,
        "topEntities": [{"name": e["name"], "type": e["type"], "confidence": e["confidence"]} for e in top_entities],
        "totalLinks": len(_ontology["links"]),
        "stats": _ontology["stats"],
    }
