"""
ARGUS — Background Task Orchestrator
Manages periodic tasks: threat monitoring, intel refresh, cache warming, health checks.
"""

import asyncio
import random
from datetime import datetime, timezone

from app.core.logging import logger
from app.events.bus import event_bus, ArgusEvent, EventType, EventSource, EventPriority


class BackgroundOrchestrator:
    """Orchestrates all background tasks for ARGUS."""

    def __init__(self):
        self._tasks: list[asyncio.Task] = []
        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True
        loop = asyncio.get_event_loop()

        self._tasks = [
            loop.create_task(self._threat_monitor_loop()),
            loop.create_task(self._intel_refresh_loop()),
            loop.create_task(self._health_check_loop()),
            loop.create_task(self._cache_warm_loop()),
            loop.create_task(self._event_bus_stats_loop()),
        ]

        logger.info(f"Background orchestrator started with {len(self._tasks)} tasks")

    async def stop(self):
        self._running = False
        for task in self._tasks:
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        logger.info("Background orchestrator stopped")

    async def _threat_monitor_loop(self):
        """Periodic local system threat scan (every 15s)."""
        while self._running:
            try:
                from app.routes.argus import _detect_local_threats
                result = await _detect_local_threats()
                if result:
                    await event_bus.publish(ArgusEvent(
                        type=EventType.THREAT_DETECTED,
                        source=EventSource.SENTINEL,
                        payload=result,
                        priority=EventPriority.MEDIUM,
                    ))
            except Exception as e:
                logger.debug(f"Threat monitor scan: {e}")
            await asyncio.sleep(15)

    async def _intel_refresh_loop(self):
        """Refresh threat intelligence feeds (every 5 min)."""
        while self._running:
            try:
                logger.debug("Refreshing threat intelligence feeds...")
                await asyncio.sleep(0.1)  # placeholder for actual feed refresh
                await event_bus.publish(ArgusEvent(
                    type=EventType.INTELLIGENCE_UPDATE,
                    source=EventSource.THREAT_INTEL,
                    payload={"status": "refreshed", "timestamp": str(datetime.now(timezone.utc))},
                    priority=EventPriority.LOW,
                ))
            except Exception as e:
                logger.error(f"Intel refresh error: {e}")
            await asyncio.sleep(300)

    async def _health_check_loop(self):
        """System health check (every 60s)."""
        while self._running:
            try:
                import psutil
                cpu = psutil.cpu_percent()
                mem = psutil.virtual_memory().percent
                disk = psutil.disk_usage("/").percent

                if cpu > 90 or mem > 90:
                    await event_bus.publish(ArgusEvent(
                        type=EventType.SYSTEM_ALERT,
                        source=EventSource.SYSTEM,
                        payload={"alert": "high_resource_usage", "cpu": cpu, "memory": mem, "disk": disk},
                        priority=EventPriority.HIGH,
                    ))
            except Exception:
                pass
            await asyncio.sleep(60)

    async def _cache_warm_loop(self):
        """Warm API caches (every 10 min)."""
        while self._running:
            try:
                # Touch intelligence endpoints to warm caches
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.get("http://localhost:8000/intelligence/news")
                    await client.get("http://localhost:8000/intelligence/cisa-kev")
            except Exception:
                pass
            await asyncio.sleep(600)

    async def _event_bus_stats_loop(self):
        """Log event bus statistics (every 5 min)."""
        while self._running:
            await asyncio.sleep(300)
            stats = event_bus.get_stats()
            logger.debug(f"Event bus stats: {stats['total_events']} events, {stats['active_subscribers']} subscribers")


# Global singleton
orchestrator = BackgroundOrchestrator()
