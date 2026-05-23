"""
ARGUS — Autonomous Cyber Defense Intelligence Platform
Main Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import logger
from fastapi.responses import JSONResponse
from app.core.exceptions import ArgusError
from app.routes import scan, simulate, history, argus, intelligence, forensic, think, gaze, university, nexus, phantom, breach_iq, hunt, mitre


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(argus.router, prefix="/argus", tags=["ARGUS"])
    app.include_router(university.router, prefix="/argus/university", tags=["University Shield"])
    app.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
    app.include_router(scan.router, prefix="/scan", tags=["Scan"])
    app.include_router(simulate.router, prefix="/simulate", tags=["Simulation"])
    app.include_router(history.router, prefix="/history", tags=["History"])
    app.include_router(forensic.router, prefix="/forensic", tags=["VERITAS Forensic"])
    app.include_router(think.router, prefix="/think", tags=["Think Engine"])
    app.include_router(gaze.router, prefix="/gaze", tags=["GAZE Omnisearch"])
    from app.routes import debate
    app.include_router(debate.router, prefix="/debate", tags=["Debate Engine"])
    app.include_router(nexus.router,     prefix="/nexus",     tags=["NEXUS Entity Graph"])
    app.include_router(phantom.router,   prefix="/phantom",   tags=["PHANTOM Deception"])
    app.include_router(breach_iq.router, prefix="/breach-iq", tags=["BREACH-IQ Risk"])
    app.include_router(hunt.router,      prefix="/hunt",      tags=["Threat Hunt"])
    app.include_router(mitre.router,     prefix="/mitre",     tags=["MITRE ATT&CK"])

    @app.on_event("startup")
    async def startup_event():
        logger.info("Application startup")

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Application shutdown")

    @app.exception_handler(ArgusError)
    async def argus_exception_handler(request, exc: ArgusError):
        return JSONResponse(
            status_code=400,
            content={"message": f"An error occurred: {exc}"},
        )

    @app.get("/")
    def root():
        return {"message": f"{settings.APP_NAME} Running"}

    @app.get("/health")
    def health():
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    return app


app = create_app()
