"""Integration tests for ARGUS cross-module pipeline:
Phishing detection → Event Bus → Correlation → Incident Creation → Response"""

import pytest
from app.events.bus import event_bus, ArgusEvent, EventType, EventSource, EventPriority
from app.events.handlers import (
    on_phishing_analyzed, on_threat_detected, on_trust_changed,
    on_correlation_complete,
)


@pytest.fixture(autouse=True)
def clear_event_bus():
    event_bus.clear_history()
    # Reset handlers
    event_bus._handlers = {}
    event_bus._wildcard_handlers = []
    yield


@pytest.mark.asyncio
async def test_full_phishing_to_response_pipeline():
    """Simulate a complete attack chain: phishing → correlation → response."""
    events_log = []

    async def collector(event):
        events_log.append((event.type, event.source, event.priority))

    event_bus.subscribe_all(collector)

    # Register pipeline handlers
    event_bus.subscribe(EventType.PHISHING_ANALYZED, on_phishing_analyzed)
    event_bus.subscribe(EventType.TRUST_CHANGED, on_trust_changed)
    event_bus.subscribe(EventType.CORRELATION_COMPLETE, on_correlation_complete)
    event_bus.subscribe(EventType.THREAT_DETECTED, on_threat_detected)

    # Step 1: Veil detects a critical phishing email
    await event_bus.publish(ArgusEvent(
        type=EventType.PHISHING_ANALYZED,
        source=EventSource.VEIL,
        payload={
            "risk_score": 92,
            "target_user": "faculty-admin@harvard.edu",
            "indicators": ["urgency", "spoofed_domain", "credential_harvesting"],
            "threat_level": "CRITICAL",
        },
        priority=EventPriority.CRITICAL,
    ))

    # Verify the chain reaction happened
    event_types = [e[0] for e in events_log]
    assert EventType.PHISHING_ANALYZED in event_types
    assert EventType.TRUST_CHANGED in event_types

    # Step 2: Sentinel detects suspicious activity
    await event_bus.publish(ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        payload={
            "event_type": "suspicious_login",
            "source_ip": "185.220.101.14",
            "country": "Russia",
            "severity": "HIGH",
        },
        priority=EventPriority.HIGH,
    ))

    # Step 3: Verify correlation was triggered
    all_types = {e[0] for e in events_log}
    assert EventType.INCIDENT_CREATED in all_types

    # Verify event source tracking
    sources = {e[1] for e in events_log}
    assert EventSource.VEIL in sources
    assert EventSource.SENTINEL in sources


@pytest.mark.asyncio
async def test_cross_module_correlation():
    """Test that multiple threat signals correctly correlate into incidents."""
    incidents = []

    async def incident_handler(event):
        if event.type == EventType.INCIDENT_CREATED:
            incidents.append(event)

    event_bus.subscribe(EventType.INCIDENT_CREATED, incident_handler)
    event_bus.subscribe(EventType.PHISHING_ANALYZED, on_phishing_analyzed)
    event_bus.subscribe(EventType.THREAT_DETECTED, on_threat_detected)

    # Simulate coordinated attack: phishing + login anomaly
    await event_bus.publish(ArgusEvent(
        type=EventType.PHISHING_ANALYZED,
        source=EventSource.VEIL,
        payload={"risk_score": 88, "target_user": "admin", "threat_level": "HIGH"},
        priority=EventPriority.HIGH,
    ))

    await event_bus.publish(ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        payload={"event_type": "impossible_travel", "severity": "CRITICAL"},
        priority=EventPriority.CRITICAL,
    ))

    # Verify at least one incident was created from the correlation
    assert len(incidents) > 0


@pytest.mark.asyncio
async def test_cloud_to_response_flow():
    """Skynet finding → Oracle correlation → Response initiation."""
    responses = []

    async def response_handler(event):
        if event.type == EventType.RESPONSE_INITIATED:
            responses.append(event)

    event_bus.subscribe(EventType.CORRELATION_COMPLETE, on_correlation_complete)
    event_bus.subscribe(EventType.RESPONSE_INITIATED, response_handler)

    # Simulate a SkyNet finding that goes through trust change → correlation → response
    await event_bus.publish(ArgusEvent(
        type=EventType.CORRELATION_COMPLETE,
        source=EventSource.SKYNET,
        payload={
            "finding_type": "PUBLIC_S3_BUCKET",
            "severity": "CRITICAL",
            "resource_name": "student-records-bucket",
            "provider": "AWS",
        },
        priority=EventPriority.HIGH,
    ))

    assert len(responses) > 0


@pytest.mark.asyncio
async def test_high_priority_escalation():
    """Critical threats should immediately create incidents."""
    escalated = []

    async def escalation_handler(event):
        if event.type == EventType.INCIDENT_CREATED:
            escalated.append(event)

    event_bus.subscribe(EventType.INCIDENT_CREATED, escalation_handler)
    event_bus.subscribe(EventType.THREAT_DETECTED, on_threat_detected)

    await event_bus.publish(ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        payload={"event_type": "ransomware_execution", "severity": "CRITICAL"},
        priority=EventPriority.CRITICAL,
    ))

    assert len(escalated) == 1


@pytest.mark.asyncio
async def test_event_idempotency():
    """Same event published twice should be handled as separate events."""
    count = 0

    async def handler(event):
        nonlocal count
        count += 1

    event_bus.subscribe(EventType.THREAT_DETECTED, handler)

    event = ArgusEvent(
        type=EventType.THREAT_DETECTED,
        source=EventSource.SENTINEL,
        payload={"test": "data"},
    )

    await event_bus.publish(event)
    await event_bus.publish(event)

    assert count == 2
