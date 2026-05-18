"""
ARGUS — Think Engine Routes
Palantir-grade intelligence pipeline: THINK → RELATE → SUGGEST → EXECUTE → PRESENT

Endpoints:
  POST /think/analyze       — full 5-primitive intelligence pipeline
  POST /think/query         — single THINK query (AGoT reasoning)
  POST /think/relate        — entity extraction + graph linking
  POST /think/suggest       — KAIROS schema + hypotheses
  POST /think/execute       — A2P causal response plan
  GET  /think/kg            — knowledge graph statistics
  GET  /think/ontology      — entity ontology summary
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.services.think_engine import (
    run_intelligence_pipeline,
    think, relate, suggest, execute, present,
    get_kg_stats, get_ontology_summary,
)

router = APIRouter()


# ── Request models ────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    question: str
    context: Optional[str] = ""
    goal: Optional[str] = ""
    skip_execute: Optional[bool] = False


class ThinkRequest(BaseModel):
    question: str
    context: Optional[str] = ""
    max_depth: Optional[int] = 3


class RelateRequest(BaseModel):
    text: str
    source: Optional[str] = None


class SuggestRequest(BaseModel):
    situation: str
    context: Optional[str] = ""


class ExecuteRequest(BaseModel):
    situation: str
    goal: str
    context: Optional[str] = ""


# ── Full pipeline ─────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Full THINK→RELATE→SUGGEST→EXECUTE→PRESENT intelligence pipeline.
    Returns complete IC-format intelligence report with BLUF, key judgments,
    evidence chains, causal response plan, and markdown report.
    """
    result = await run_intelligence_pipeline(
        question=req.question,
        context=req.context or "",
        goal=req.goal or req.question,
        skip_execute=req.skip_execute or False,
    )
    return result


# ── Individual primitives ─────────────────────────────────────────────────────

@router.post("/query")
async def think_query(req: ThinkRequest):
    """
    THINK primitive only — AGoT recursive reasoning DAG.
    Good for single questions requiring structured analysis.
    """
    return await think(req.question, req.context or "", req.max_depth or 3)


@router.post("/relate")
async def relate_entities(req: RelateRequest):
    """
    RELATE primitive — extract Palantir-style entities and links from text.
    Runs "search around" BFS to find indirect connections.
    """
    return await relate(req.text, req.source)


@router.post("/suggest")
async def suggest_hypotheses(req: SuggestRequest):
    """
    SUGGEST primitive — KAIROS schema classification + ranked abductive hypotheses.
    Returns threat schema, confidence, and 3 ranked hypotheses with evidence chains.
    """
    return await suggest(req.situation, req.context or "")


@router.post("/execute")
async def execute_plan(req: ExecuteRequest):
    """
    EXECUTE primitive — A2P causal response plan.
    Abducts root causes, designs minimal interventions, predicts outcomes.
    """
    return await execute(req.situation, req.goal, req.context or "")


# ── Knowledge state ───────────────────────────────────────────────────────────

@router.get("/kg")
def knowledge_graph_stats():
    """Knowledge graph statistics — triple count, entity count, communities."""
    return get_kg_stats()


@router.get("/ontology")
def ontology_summary():
    """Palantir-style entity ontology summary — type distribution, top entities, link count."""
    return get_ontology_summary()
