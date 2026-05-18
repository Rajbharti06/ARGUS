"""
ARGUS — Event Handlers
Cross-module correlation handlers that connect Sentinel, Veil, Identity, Oracle, Skynet.
Each handler listens for events and triggers actions in other modules.
"""

from app.events.bus import event_bus, ArgusEvent, EventType, EventSource, EventPriority
from app.core.logging import logger


async def on_threat_detected(event: ArgusEvent):
    """When Sentinel detects a threat, notify Oracle for correlation."""
    logger.info(f"Threat detected: {event.payload.get('event_type')} — triggering Oracle correlation")
    await event_bus.publish(ArgusEvent(
        type=EventType.INCIDENT_CREATED,
        source=EventSource.SENTINEL,
        payload={
            "trigger_event_id": event.id,
            "correlation_source": "sentinel",
            "threat_data": event.payload,
        },
        priority=event.priority,
        correlation_id=event.correlation_id,
    ))


async def on_phishing_analyzed(event: ArgusEvent):
    """When Veil detects phishing, alert Identity + Sentinel."""
    risk_score = event.payload.get("risk_score", 0)
    logger.info(f"Phishing analyzed: risk={risk_score} — notifying Identity + Sentinel")

    # Notify Identity to watch for credential compromise
    await event_bus.publish(ArgusEvent(
        type=EventType.TRUST_CHANGED,
        source=EventSource.VEIL,
        payload={
            "trigger_event_id": event.id,
            "reason": "phishing_detected",
            "risk_score": risk_score,
            "target_user": event.payload.get("target_user"),
        },
        priority=EventPriority.HIGH if risk_score > 70 else EventPriority.MEDIUM,
        correlation_id=event.correlation_id,
    ))


async def on_trust_changed(event: ArgusEvent):
    """When trust drops, check if Oracle needs to update incident."""
    risk_score = event.payload.get("risk_score", 0)
    if risk_score > 70:
        logger.info(f"Trust dropped to {risk_score} — escalating to Oracle")
        await event_bus.publish(ArgusEvent(
            type=EventType.CORRELATION_COMPLETE,
            source=EventSource.IDENTITY,
            payload={
                "trigger_event_id": event.id,
                "reason": event.payload.get("reason"),
                "risk_score": risk_score,
                "target_user": event.payload.get("target_user"),
            },
            priority=EventPriority.HIGH,
            correlation_id=event.correlation_id,
        ))


async def on_cloud_finding(event: ArgusEvent):
    """When Skynet finds cloud exposure, notify Oracle."""
    severity = event.payload.get("severity", "MEDIUM")
    if severity in ("HIGH", "CRITICAL"):
        logger.info(f"Cloud finding: {severity} — correlating with Oracle")
        await event_bus.publish(ArgusEvent(
            type=EventType.CORRELATION_COMPLETE,
            source=EventSource.SKYNET,
            payload={
                "trigger_event_id": event.id,
                "finding_type": event.payload.get("finding_type"),
                "severity": severity,
                "resource": event.payload.get("resource_name"),
            },
            priority=EventPriority.HIGH,
            correlation_id=event.correlation_id,
        ))


async def on_correlation_complete(event: ArgusEvent):
    """When Oracle finishes correlation, notify Response for action."""
    logger.info("Correlation complete — notifying Response engine")
    await event_bus.publish(ArgusEvent(
        type=EventType.RESPONSE_INITIATED,
        source=EventSource.ORACLE,
        payload={
            "trigger_event_id": event.id,
            "incident_data": event.payload,
        },
        priority=event.priority,
        correlation_id=event.correlation_id,
    ))


def register_all_handlers():
    """Register all cross-module event handlers."""
    event_bus.subscribe(EventType.THREAT_DETECTED, on_threat_detected)
    event_bus.subscribe(EventType.PHISHING_ANALYZED, on_phishing_analyzed)
    event_bus.subscribe(EventType.TRUST_CHANGED, on_trust_changed)
    event_bus.subscribe(EventType.CLOUD_FINDING, on_cloud_finding)
    event_bus.subscribe(EventType.CORRELATION_COMPLETE, on_correlation_complete)
    logger.info("All cross-module event handlers registered")
