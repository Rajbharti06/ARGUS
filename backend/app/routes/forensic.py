"""
VERITAS — Forensic Analysis Route
POST /forensic/analyze — upload any file for authenticity analysis.
"""

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.services.forensic_service import analyze_file
from app.core.logging import logger

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/analyze")
async def analyze_evidence(
    file: UploadFile = File(...),
    provider: str = Form(default="featherless"),
    api_key: str = Form(default=""),
):
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        return JSONResponse(status_code=413, content={"error": "File too large. Maximum 50 MB."})
    if not data:
        return JSONResponse(status_code=400, content={"error": "Empty file uploaded."})

    logger.info(f"Forensic analysis: {file.filename} ({len(data)} bytes)")
    try:
        report = analyze_file(data, file.filename or "unknown", provider, api_key)
        return report
    except Exception as e:
        logger.error(f"Forensic analysis failed: {e}")
        return JSONResponse(status_code=500, content={"error": f"Analysis failed: {str(e)}"})


@router.get("/demo")
async def demo_report():
    """Return a pre-built demo forensic report for UI testing."""
    return {
        "filename": "suspect_footage_2026.jpg",
        "file_hash": "bb7c58846191332bc41ac59dde9c0cc1b9718fb4fe6c32b603a6088616f13538",
        "file_type": "Image",
        "trust_score": 18,
        "risk_level": "CRITICAL",
        "synthetic_probability": 82,
        "findings": [
            {
                "severity": "critical",
                "title": "GAN / AI Generation Detected",
                "detail": "Neural network detector reports 82% probability of synthetic AI generation. Pattern consistent with Stable Diffusion output pipeline.",
                "confidence": 87,
            },
            {
                "severity": "critical",
                "title": "Metadata Stripped",
                "detail": "Image contains no EXIF data. Authentic camera captures always embed metadata. Stripping is common before sharing manipulated content.",
                "confidence": 78,
            },
            {
                "severity": "high",
                "title": "EXIF Timestamp Predates Camera Model",
                "detail": "File creation timestamp is 14 months before the claimed camera model entered production. Metadata has been retroactively modified.",
                "confidence": 66,
            },
        ],
        "reasoning_chain": [
            "DCT coefficient histogram deviates from natural camera baseline by 4.7σ",
            "GPS coordinates embedded in EXIF data do not match claimed capture location",
            "Skin texture frequency spectrum inconsistent with optical capture — GAN fingerprint",
            "Clone stamp probability: 83% based on self-similarity maps and noise fingerprint",
        ],
        "alternative_hypothesis": "Multiple re-encoding cycles from platform sharing could introduce artifacts mimicking manipulation signatures.",
        "admissibility": "LOW admissibility — significant integrity issues; expert forensic testimony required.",
        "metadata": {
            "File Size": "0.10 MB",
            "File Type": "Image",
            "Extension": ".jpg",
            "SHA-256": "bb7c58846191332b...",
            "EXIF Integrity": "STRIPPED / MISSING",
            "Editing Signatures": "Stable Diffusion",
        },
        "timeline": [
            {"timestamp": "2026-03-26T03:14:45Z", "label": "File allegedly created", "status": "SUSPICIOUS", "detail": "Claimed origin: suspect_footage_2026.jpg"},
            {"timestamp": "2026-04-20T03:14:45Z", "label": "Editing software signature detected", "status": "SUSPICIOUS", "detail": "Stable Diffusion fingerprint found in file structure"},
            {"timestamp": "2026-05-10T00:14:45Z", "label": "File submitted as evidence", "status": "INFO", "detail": "SHA-256: bb7c58846191332b..."},
            {"timestamp": "2026-05-10T03:14:45Z", "label": "VERITAS ARGUS analysis complete", "status": "INFO", "detail": "Trust Score: 18% — CRITICAL"},
        ],
        "c2pa_status": "NOT_PRESENT",
        "analyzed_at": "2026-05-10T03:14:45Z",
    }
