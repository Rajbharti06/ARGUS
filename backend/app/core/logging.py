"""
UniShield AI — Structured Logging
Centralized, JSON-formatted logger for the application.
"""

import logging
import sys

logger = logging.getLogger("argus")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    try:
        from pythonjsonlogger import jsonlogger
        handler.setFormatter(jsonlogger.JsonFormatter("%(asctime)s %(name)s %(levelname)s %(message)s"))
    except ImportError:
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(handler)
