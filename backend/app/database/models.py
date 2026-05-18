"""ARGUS — SQLAlchemy ORM Models"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, Enum as SAEnum,
    ForeignKey, Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.database.session import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class EventType(str, enum.Enum):
    FAILED_LOGIN = "failed_login"
    SUSPICIOUS_PROCESS = "suspicious_process"
    PHISHING_DETECTED = "phishing_detected"
    IMPOSSIBLE_TRAVEL = "impossible_travel"
    CLOUD_EXPOSURE = "cloud_exposure"
    LATERAL_MOVEMENT = "lateral_movement"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    DATA_EXFILTRATION = "data_exfiltration"
    MALWARE_DETECTED = "malware_detected"
    BRUTE_FORCE = "brute_force"
    SESSION_ANOMALY = "session_anomaly"
    IAM_ISSUE = "iam_issue"
    API_KEY_LEAK = "api_key_leak"

class IncidentStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    TRIAGING = "TRIAGING"
    CONTAINING = "CONTAINING"
    CONTAINED = "CONTAINED"
    ERADICATING = "ERADICATING"
    RECOVERING = "RECOVERING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class EntityType(str, enum.Enum):
    USER = "user"
    IP_ADDRESS = "ip_address"
    DOMAIN = "domain"
    DEVICE = "device"
    FILE = "file"
    PROCESS = "process"
    CLOUD_RESOURCE = "cloud_resource"
    EMAIL = "email"
    SESSION = "session"

class TrustLevel(str, enum.Enum):
    TRUSTED = "TRUSTED"
    SUSPICIOUS = "SUSPICIOUS"
    COMPROMISED = "COMPROMISED"
    BLOCKED = "BLOCKED"


# ── Helper ───────────────────────────────────────────────────────────────────

def _uuid():
    return str(uuid.uuid4())

def _now():
    return datetime.now(timezone.utc)


# ── Core Tables ──────────────────────────────────────────────────────────────

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(String, primary_key=True, default=_uuid)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=_now)
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default="LOW")

    source_ip = Column(String(45), nullable=True)
    source_country = Column(String(100), nullable=True)
    source_city = Column(String(100), nullable=True)
    source_isp = Column(String(200), nullable=True)
    is_proxy = Column(Boolean, default=False)
    is_hosting = Column(Boolean, default=False)

    target_user = Column(String(100), nullable=True)
    target_system = Column(String(200), nullable=True)
    target_resource = Column(String(200), nullable=True)

    process_name = Column(String(200), nullable=True)
    process_pid = Column(Integer, nullable=True)

    raw_data = Column(JSON, nullable=True)
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)

    module_source = Column(String(50), nullable=False, index=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_telemetry_timestamp", "timestamp"),
        Index("idx_telemetry_type_severity", "event_type", "severity"),
    )


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String, primary_key=True, default=_uuid)
    entity_type = Column(String(50), nullable=False, index=True)
    label = Column(String(500), nullable=False)
    metadata_json = Column(JSON, nullable=True, default=dict)

    first_seen = Column(DateTime(timezone=True), default=_now)
    last_seen = Column(DateTime(timezone=True), default=_now)
    trust_score = Column(Integer, default=100)
    risk_score = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE")

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_entity_type_status", "entity_type", "status"),
    )


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String, primary_key=True, default=_uuid)
    from_entity_id = Column(String, ForeignKey("entities.id"), nullable=False, index=True)
    to_entity_id = Column(String, ForeignKey("entities.id"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False)
    label = Column(String(500), nullable=True)

    timestamp = Column(DateTime(timezone=True), default=_now)
    confidence = Column(Float, default=0.0)
    evidence = Column(JSON, nullable=True)
    source = Column(String(50), nullable=True)

    from_entity = relationship("Entity", foreign_keys=[from_entity_id])
    to_entity = relationship("Entity", foreign_keys=[to_entity_id])

    created_at = Column(DateTime(timezone=True), default=_now)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="MEDIUM")
    status = Column(String(30), nullable=False, default="DETECTED")

    attack_chain = Column(JSON, nullable=True)
    timeline = Column(JSON, nullable=True)
    entities = Column(JSON, nullable=True)
    narrative = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)

    ai_summary = Column(Text, nullable=True)
    recommended_actions = Column(JSON, nullable=True)

    detected_at = Column(DateTime(timezone=True), default=_now)
    contained_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    events = relationship("TelemetryEvent", backref="incident", lazy="selectin")

    __table_args__ = (
        Index("idx_incident_status", "status"),
        Index("idx_incident_severity", "severity"),
    )


class PhishingAnalysis(Base):
    __tablename__ = "phishing_analyses"

    id = Column(String, primary_key=True, default=_uuid)
    input_text = Column(Text, nullable=False)
    input_type = Column(String(20), default="email")

    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    threat_level = Column(String(20), default="LOW")

    detected_indicators = Column(JSON, nullable=True)
    urls_found = Column(JSON, nullable=True)
    spoofed_domains = Column(JSON, nullable=True)

    ai_explanation = Column(Text, nullable=True)
    executive_summary = Column(Text, nullable=True)
    recommended_actions = Column(JSON, nullable=True)

    provider_used = Column(String(100), nullable=True)
    model_used = Column(String(100), nullable=True)
    analysis_time_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)


class CloudFinding(Base):
    __tablename__ = "cloud_findings"

    id = Column(String, primary_key=True, default=_uuid)
    provider = Column(String(50), nullable=False)
    service = Column(String(100), nullable=False)
    finding_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, default="MEDIUM")

    resource_name = Column(String(300), nullable=True)
    region = Column(String(100), nullable=True)
    status = Column(String(30), default="OPEN")

    cis_control = Column(String(100), nullable=True)
    remediation = Column(Text, nullable=True)

    detected_at = Column(DateTime(timezone=True), default=_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String(100), nullable=False, index=True)
    user_name = Column(String(200), nullable=True)
    role = Column(String(100), nullable=True)

    trust_score = Column(Integer, default=100)
    risk_score = Column(Integer, default=0)
    trust_level = Column(String(30), default="TRUSTED")

    ip_address = Column(String(45), nullable=True)
    country = Column(String(100), nullable=True)
    device_fingerprint = Column(String(200), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)

    login_time = Column(DateTime(timezone=True), default=_now)
    last_active = Column(DateTime(timezone=True), default=_now)
    session_duration_minutes = Column(Integer, default=0)

    anomalies = Column(JSON, nullable=True)
    is_blocked = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class ThreatIntel(Base):
    __tablename__ = "threat_intel"

    id = Column(String, primary_key=True, default=_uuid)
    source = Column(String(100), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)

    threat_type = Column(String(50), nullable=True)
    severity = Column(String(20), default="MEDIUM")
    affected_sector = Column(String(100), nullable=True)

    published_at = Column(DateTime(timezone=True), nullable=True)
    ingested_at = Column(DateTime(timezone=True), default=_now)

    raw_data = Column(JSON, nullable=True)


class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(String, primary_key=True, default=_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True, index=True)
    action_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)
    status = Column(String(30), default="PENDING")

    target_type = Column(String(50), nullable=True)
    target_value = Column(String(500), nullable=True)
    confidence = Column(Float, default=0.0)

    initiated_at = Column(DateTime(timezone=True), default=_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    result = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)


# ── Registry for Alembic migrations ─────────────────────────────────────────

ALL_MODELS = [
    TelemetryEvent, Entity, Relationship, Incident,
    PhishingAnalysis, CloudFinding, UserSession, ThreatIntel, ResponseAction,
]
