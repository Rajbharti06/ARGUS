"""
ARGUS — CVE Intelligence Engine
Real-time CVE data from NVD NIST API v2.0 + CISA KEV feed.
No API key required for basic usage (5 req/30s rate limit).
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.core.logging import logger

NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0"
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

# Severity color mapping
CVSS_SEVERITY = {
    "CRITICAL": {"color": "#FF3B5C", "min": 9.0},
    "HIGH":     {"color": "#f97316", "min": 7.0},
    "MEDIUM":   {"color": "#eab308", "min": 4.0},
    "LOW":      {"color": "#6b9e7a", "min": 0.1},
    "NONE":     {"color": "#6d8588", "min": 0.0},
}

_cve_cache: dict = {}
_kev_cache: dict = {}
_cache_ttl = 900  # 15 minutes


def _cvss_to_severity(score: float) -> str:
    if score >= 9.0:   return "CRITICAL"
    if score >= 7.0:   return "HIGH"
    if score >= 4.0:   return "MEDIUM"
    if score >= 0.1:   return "LOW"
    return "NONE"


def _parse_cve(item: dict) -> dict:
    cve = item.get("cve", {})
    cve_id = cve.get("id", "")
    desc_list = cve.get("descriptions", [])
    description = next((d["value"] for d in desc_list if d.get("lang") == "en"), "No description available.")

    # Extract CVSS v3.1 score (preferred) or v2
    metrics = cve.get("metrics", {})
    score, severity, vector = 0.0, "NONE", ""

    if metrics.get("cvssMetricV31"):
        m = metrics["cvssMetricV31"][0]
        data = m.get("cvssData", {})
        score    = data.get("baseScore", 0.0)
        severity = data.get("baseSeverity", "NONE").upper()
        vector   = data.get("vectorString", "")
    elif metrics.get("cvssMetricV30"):
        m = metrics["cvssMetricV30"][0]
        data = m.get("cvssData", {})
        score    = data.get("baseScore", 0.0)
        severity = data.get("baseSeverity", "NONE").upper()
        vector   = data.get("vectorString", "")
    elif metrics.get("cvssMetricV2"):
        m = metrics["cvssMetricV2"][0]
        data = m.get("cvssData", {})
        score = data.get("baseScore", 0.0)
        severity = _cvss_to_severity(score)

    # Weaknesses / CWEs
    weaknesses = []
    for w in cve.get("weaknesses", []):
        for d in w.get("description", []):
            if d.get("lang") == "en":
                weaknesses.append(d["value"])

    # References
    refs = [r.get("url", "") for r in cve.get("references", [])[:3]]

    published = cve.get("published", "")[:10]
    modified  = cve.get("lastModified", "")[:10]

    return {
        "id":          cve_id,
        "description": description[:300] + "..." if len(description) > 300 else description,
        "score":       score,
        "severity":    severity,
        "vector":      vector,
        "weaknesses":  weaknesses[:3],
        "references":  refs,
        "published":   published,
        "modified":    modified,
        "color":       CVSS_SEVERITY.get(severity, {}).get("color", "#6d8588"),
    }


async def fetch_recent_cves(
    severity: Optional[str] = None,
    keyword: Optional[str] = None,
    days_back: int = 7,
    limit: int = 20,
) -> dict:
    """Fetch recent CVEs from NVD API v2.0."""
    cache_key = f"{severity}:{keyword}:{days_back}:{limit}"
    now = datetime.utcnow()

    if cache_key in _cve_cache:
        cached_at, data = _cve_cache[cache_key]
        if (now - cached_at).seconds < _cache_ttl:
            return data

    params: dict = {
        "resultsPerPage": min(limit, 50),
        "pubStartDate":   (now - timedelta(days=days_back)).strftime("%Y-%m-%dT00:00:00.000"),
        "pubEndDate":     now.strftime("%Y-%m-%dT23:59:59.000"),
    }
    if severity:
        params["cvssV3Severity"] = severity.upper()
    if keyword:
        params["keywordSearch"] = keyword

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(NVD_BASE, params=params)
            r.raise_for_status()
            raw = r.json()
    except Exception as exc:
        logger.warning(f"NVD API error: {exc}")
        return {"cves": [], "total": 0, "error": str(exc)}

    vulnerabilities = raw.get("vulnerabilities", [])
    cves = [_parse_cve(v) for v in vulnerabilities]
    cves.sort(key=lambda x: x["score"], reverse=True)

    result = {
        "cves":          cves[:limit],
        "total":         raw.get("totalResults", 0),
        "fetched":       len(cves),
        "days_back":     days_back,
        "timestamp":     now.isoformat(),
    }
    _cve_cache[cache_key] = (now, result)
    return result


async def fetch_kev() -> dict:
    """Fetch CISA Known Exploited Vulnerabilities catalog."""
    global _kev_cache
    now = datetime.utcnow()

    if _kev_cache.get("data") and (now - _kev_cache.get("fetched_at", now)).seconds < _cache_ttl * 2:
        return _kev_cache["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(CISA_KEV_URL)
            r.raise_for_status()
            raw = r.json()
    except Exception as exc:
        logger.warning(f"CISA KEV error: {exc}")
        return {"vulnerabilities": [], "count": 0, "error": str(exc)}

    vulns = raw.get("vulnerabilities", [])
    # Most recently added first
    vulns_sorted = sorted(vulns, key=lambda x: x.get("dateAdded", ""), reverse=True)

    recent = []
    for v in vulns_sorted[:30]:
        recent.append({
            "id":               v.get("cveID", ""),
            "vendor":           v.get("vendorProject", ""),
            "product":          v.get("product", ""),
            "name":             v.get("vulnerabilityName", ""),
            "date_added":       v.get("dateAdded", ""),
            "due_date":         v.get("dueDate", ""),
            "description":      v.get("shortDescription", "")[:200],
            "action_required":  v.get("requiredAction", ""),
            "known_ransomware": v.get("knownRansomwareCampaignUse", "Unknown"),
        })

    result = {
        "vulnerabilities": recent,
        "total_kev":       len(vulns),
        "catalog_version": raw.get("catalogVersion", ""),
        "date_released":   raw.get("dateReleased", ""),
        "timestamp":       now.isoformat(),
    }
    _kev_cache = {"data": result, "fetched_at": now}
    return result


async def cve_summary() -> dict:
    """Quick summary: recent critical CVEs + KEV stats."""
    cve_task = fetch_recent_cves(severity="CRITICAL", days_back=7, limit=5)
    kev_task = fetch_kev()

    cves_result, kev_result = await asyncio.gather(cve_task, kev_task, return_exceptions=True)

    critical_cves = cves_result.get("cves", []) if isinstance(cves_result, dict) else []
    kev_count     = kev_result.get("total_kev", 1132) if isinstance(kev_result, dict) else 1132
    recent_kev    = kev_result.get("vulnerabilities", [])[:5] if isinstance(kev_result, dict) else []

    return {
        "critical_cves_7d": len(critical_cves),
        "top_critical":     critical_cves,
        "kev_total":        kev_count,
        "recent_kev":       recent_kev,
    }
