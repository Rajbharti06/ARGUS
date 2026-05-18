"""Tests for ARGUS event bus / pub-sub system."""

import pytest
from app.events.bus import EventBus, ArgusEvent, EventType, EventSource, EventPriority


@pytest.fixture
def bus():
    return EventBus()


@pytest.mark.asyncio
async def test_publish_subscribe(bus):
    received = []

    async def handler(event):
        received.append(event)

    bus.subscribe(EventType.THREAT_DETECTED, handler)

    event = ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        payload={"event_type": "failed_login", "severity": "HIGH"},
        priority=EventPriority.HIGH,
    )
    await bus.publish(event)

    assert len(received) == 1
    assert received[0].type == EventType.THREAT_DETECTED
    assert received[0].source == EventSource.SENTINEL
    assert received[0].payload["event_type"] == "failed_login"


@pytest.mark.asyncio
async def test_wildcard_handler(bus):
    received = []

    async def wildcard(event):
        received.append(event)

    bus.subscribe_all(wildcard)

    await bus.publish(ArgusEvent(
        type=EventType.TRUST_CHANGED,
        source=EventSource.IDENTITY,
        payload={},
    ))
    await bus.publish(ArgusEvent(
        type=EventType.CLOUD_FINDING,
        source=EventSource.SKYNET,
        payload={},
    ))

    assert len(received) == 2


@pytest.mark.asyncio
async def test_event_history(bus):
    for i in range(5):
        await bus.publish(ArgusEvent(
            type=EventType.THREAT_DETECTED,
            source=EventSource.SENTINEL,
            payload={"index": i},
        ))

    history = bus.get_history(limit=3)
    assert len(history) == 3

    sentinel_events = bus.get_history(source=EventSource.SENTINEL)
    assert len(sentinel_events) == 5


@pytest.mark.asyncio
async def test_event_priority(bus):
    received = []

    async def handler(event):
        received.append(event.priority)

    bus.subscribe(EventType.THREAT_DETECTED, handler)

    await bus.publish(ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        priority=EventPriority.CRITICAL,
    ))

    assert received[0] == EventPriority.CRITICAL


@pytest.mark.asyncio
async def test_event_expiry(bus):
    from datetime import datetime, timezone, timedelta
    event = ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        ttl_seconds=0,
        timestamp=(datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat(),
    )
    assert event.is_expired()


@pytest.mark.asyncio
async def test_unsubscribe(bus):
    received = []

    async def handler(event):
        received.append(event)

    bus.subscribe(EventType.THREAT_DETECTED, handler)
    bus.unsubscribe(EventType.THREAT_DETECTED, handler)

    await bus.publish(ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
    ))

    assert len(received) == 0


@pytest.mark.asyncio
async def test_bus_stats(bus):
    await bus.publish(ArgusEvent(type=EventType.THREAT_DETECTED, source=EventSource.SENTINEL))
    await bus.publish(ArgusEvent(type=EventType.PHISHING_ANALYZED, source=EventSource.VEIL))

    stats = bus.get_stats()
    assert stats["total_events"] == 2
    assert stats["by_type"]["threat_detected"] == 1
    assert stats["by_type"]["phishing_analyzed"] == 1


@pytest.mark.asyncio
async def test_handler_error_isolation(bus):
    """One handler error should not crash other handlers."""

    results = []

    async def failing_handler(event):
        raise ValueError("Intentional failure")

    async def working_handler(event):
        results.append("success")

    bus.subscribe(EventType.THREAT_DETECTED, failing_handler)
    bus.subscribe(EventType.THREAT_DETECTED, working_handler)

    await bus.publish(ArgusEvent(type=EventType.THREAT_DETECTED, source=EventSource.SENTINEL))
    assert len(results) == 1


@pytest.mark.asyncio
async def test_clear_history(bus):
    await bus.publish(ArgusEvent(type=EventType.THREAT_DETECTED, source=EventSource.SENTINEL))
    assert bus.event_count > 0
    bus.clear_history()
    assert bus.event_count == 0
