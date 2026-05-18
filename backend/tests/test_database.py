"""Tests for ARGUS database models and repository layer."""

import pytest
from datetime import datetime, timezone
from app.database.models import (
    TelemetryEvent, Entity, Relationship, Incident, PhishingAnalysis,
    CloudFinding, UserSession, ThreatIntel, ResponseAction,
)
from app.database.repository import BaseRepository


@pytest.mark.asyncio
async def test_telemetry_event_create(db_session):
    repo = BaseRepository(TelemetryEvent, db_session)
    event = await repo.create(
        event_type="failed_login",
        severity="HIGH",
        source_ip="185.220.101.14",
        source_country="Romania",
        module_source="sentinel",
    )
    assert event.id is not None
    assert event.event_type == "failed_login"
    assert event.severity == "HIGH"
    assert event.module_source == "sentinel"


@pytest.mark.asyncio
async def test_entity_repository(db_session):
    repo = BaseRepository(Entity, db_session)
    entity = await repo.create(
        entity_type="ip_address",
        label="185.220.101.14",
        risk_score=75,
        status="SUSPICIOUS",
    )
    assert entity.id is not None
    assert entity.entity_type == "ip_address"
    assert entity.risk_score == 75

    # Test get
    fetched = await repo.get(entity.id)
    assert fetched is not None
    assert fetched.label == "185.220.101.14"

    # Test update
    updated = await repo.update(entity.id, risk_score=90)
    assert updated is not None
    assert updated.risk_score == 90


@pytest.mark.asyncio
async def test_relationship_crud(db_session):
    repo = BaseRepository(Relationship, db_session)
    entity_repo = BaseRepository(Entity, db_session)

    user = await entity_repo.create(entity_type="user", label="raj_admin")
    ip = await entity_repo.create(entity_type="ip_address", label="10.0.0.1")

    rel = await repo.create(
        from_entity_id=user.id,
        to_entity_id=ip.id,
        relationship_type="accessed_from",
        confidence=0.95,
    )
    assert rel.id is not None
    assert rel.relationship_type == "accessed_from"


@pytest.mark.asyncio
async def test_incident_with_events(db_session):
    incident_repo = BaseRepository(Incident, db_session)
    event_repo = BaseRepository(TelemetryEvent, db_session)

    incident = await incident_repo.create(
        title="Test incident",
        severity="CRITICAL",
        status="DETECTED",
        confidence=0.92,
    )
    assert incident.id is not None
    assert incident.title == "Test incident"


@pytest.mark.asyncio
async def test_phishing_analysis(db_session):
    repo = BaseRepository(PhishingAnalysis, db_session)
    analysis = await repo.create(
        input_text="URGENT: Verify your account credentials",
        input_type="email",
        risk_score=85.0,
        confidence=0.93,
        threat_level="CRITICAL",
        detected_indicators={"urgency": True, "credential_harvesting": True},
        executive_summary="Credential harvesting campaign detected",
    )
    assert analysis.id is not None
    assert analysis.risk_score == 85.0
    assert analysis.threat_level == "CRITICAL"


@pytest.mark.asyncio
async def test_cloud_finding(db_session):
    repo = BaseRepository(CloudFinding, db_session)
    finding = await repo.create(
        provider="AWS",
        service="S3",
        finding_type="PUBLIC_BUCKET",
        description="S3 bucket is publicly accessible",
        severity="CRITICAL",
        cis_control="CIS 2.1.1",
    )
    assert finding.id is not None
    assert finding.provider == "AWS"


@pytest.mark.asyncio
async def test_user_session(db_session):
    repo = BaseRepository(UserSession, db_session)
    session = await repo.create(
        user_id="raj_admin",
        user_name="Raj Admin",
        role="admin",
        trust_score=45,
        trust_level="SUSPICIOUS",
        ip_address="185.220.101.14",
        country="Russia",
        anomalies={"impossible_travel": True},
    )
    assert session.id is not None
    assert session.trust_score == 45


@pytest.mark.asyncio
async def test_threat_intel(db_session):
    repo = BaseRepository(ThreatIntel, db_session)
    intel = await repo.create(
        source="CISA",
        title="Critical vulnerability in Ivanti VPN",
        threat_type="CVE",
        severity="CRITICAL",
        url="https://cisa.gov/advisory",
    )
    assert intel.id is not None
    assert intel.source == "CISA"


@pytest.mark.asyncio
async def test_repository_search(db_session):
    repo = BaseRepository(TelemetryEvent, db_session)
    for i in range(5):
        await repo.create(
            event_type="failed_login",
            severity="HIGH" if i % 2 == 0 else "MEDIUM",
            source_ip=f"10.0.0.{i}",
            module_source="sentinel",
        )

    events = await repo.get_many(limit=10)
    assert len(events) >= 5

    high_events = await repo.get_many(filters={"severity": "HIGH"})
    assert all(e.severity == "HIGH" for e in high_events)


@pytest.mark.asyncio
async def test_repository_count(db_session):
    repo = BaseRepository(TelemetryEvent, db_session)
    count = await repo.count()
    assert isinstance(count, int)
