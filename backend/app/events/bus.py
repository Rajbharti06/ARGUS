"""
ARGUS — Event Bus / Pub-Sub System
In-process async event bus for inter-module communication.
Enables real-time correlation across Sentinel, Veil, Identity, Oracle, Skynet, Response.
"""

import asyncio
import uuid
import time
from datetime import datetime, timezone
from typing import Callable, Coroutine, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from app.core.logging import logger


class EventPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EventSource(str, Enum):
    SENTINEL = "sentinel"
    VEIL = "veil"
    IDENTITY = "identity"
    ORACLE = "oracle"
    SKYNET = "skynet"
    RESPONSE = "response"
    THREAT_INTEL = "threat_intel"
    SYSTEM = "system"


class EventType(str, Enum):
    THREAT_DETECTED = "threat_detected"
    PHISHING_ANALYZED = "phishing_analyzed"
    TRUST_CHANGED = "trust_changed"
    INCIDENT_CREATED = "incident_created"
    INCIDENT_UPDATED = "incident_updated"
    CORRELATION_COMPLETE = "correlation_complete"
    RESPONSE_INITIATED = "response_initiated"
    RESPONSE_COMPLETED = "response_completed"
    CLOUD_FINDING = "cloud_finding"
    ANOMALY_DETECTED = "anomaly_detected"
    SYSTEM_ALERT = "system_alert"
    INTELLIGENCE_UPDATE = "intelligence_update"


@dataclass
class ArgusEvent:
    type: EventType
    source: EventSource
    payload: dict = field(default_factory=dict)
    priority: EventPriority = EventPriority.MEDIUM
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    correlation_id: Optional[str] = None
    ttl_seconds: int = 300

    def is_expired(self) -> bool:
        created = datetime.fromisoformat(self.timestamp)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()
        return elapsed > self.ttl_seconds


EventHandler = Callable[[ArgusEvent], Coroutine[Any, Any, None]]


class EventBus:
    def __init__(self):
        self._handlers: dict[EventType, list[EventHandler]] = {}
        self._wildcard_handlers: list[EventHandler] = []
        self._history: list[ArgusEvent] = []
        self._max_history = 1000
        self._lock = asyncio.Lock()

    def subscribe(self, event_type: EventType, handler: EventHandler):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.info(f"Handler registered for {event_type.value}")

    def subscribe_all(self, handler: EventHandler):
        self._wildcard_handlers.append(handler)
        logger.info("Wildcard handler registered")

    def unsubscribe(self, event_type: EventType, handler: EventHandler):
        if event_type in self._handlers:
            self._handlers[event_type] = [h for h in self._handlers[event_type] if h is not handler]

    async def publish(self, event: ArgusEvent):
        async with self._lock:
            self._history.append(event)
            if len(self._history) > self._max_history:
                self._history = self._history[-self._max_history:]

        logger.debug(f"Event: {event.type.value} from {event.source.value} [priority={event.priority.value}]")

        tasks = []

        if event.type in self._handlers:
            for handler in self._handlers[event.type]:
                tasks.append(self._safe_dispatch(handler, event))

        for handler in self._wildcard_handlers:
            tasks.append(self._safe_dispatch(handler, event))

        if tasks:
            await asyncio.gather(*tasks)

    async def _safe_dispatch(self, handler: EventHandler, event: ArgusEvent):
        try:
            await handler(event)
        except Exception as e:
            logger.error(f"Handler error for {event.type.value}: {e}")

    def get_history(
        self,
        event_type: Optional[EventType] = None,
        source: Optional[EventSource] = None,
        limit: int = 50,
    ) -> list[ArgusEvent]:
        events = self._history
        if event_type:
            events = [e for e in events if e.type == event_type]
        if source:
            events = [e for e in events if e.source == source]
        return events[-limit:]

    def clear_history(self):
        self._history = []

    @property
    def event_count(self) -> int:
        return len(self._history)

    def get_stats(self) -> dict:
        counts = {}
        for event in self._history:
            counts[event.type.value] = counts.get(event.type.value, 0) + 1
        return {
            "total_events": len(self._history),
            "by_type": counts,
            "active_subscribers": sum(len(h) for h in self._handlers.values()),
        }


# Global singleton
event_bus = EventBus()
