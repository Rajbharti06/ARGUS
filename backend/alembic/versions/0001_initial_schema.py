"""Initial ARGUS database schema

Revision ID: 0001
Revises:
Create Date: 2026-05-12
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Telemetry Events
    op.create_table(
        "telemetry_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("source_ip", sa.String(45), nullable=True),
        sa.Column("source_country", sa.String(100), nullable=True),
        sa.Column("source_city", sa.String(100), nullable=True),
        sa.Column("source_isp", sa.String(200), nullable=True),
        sa.Column("is_proxy", sa.Boolean(), default=False),
        sa.Column("is_hosting", sa.Boolean(), default=False),
        sa.Column("target_user", sa.String(100), nullable=True),
        sa.Column("target_system", sa.String(200), nullable=True),
        sa.Column("target_resource", sa.String(200), nullable=True),
        sa.Column("process_name", sa.String(200), nullable=True),
        sa.Column("process_pid", sa.Integer(), nullable=True),
        sa.Column("raw_data", sa.JSON(), nullable=True),
        sa.Column("risk_score", sa.Float(), default=0.0),
        sa.Column("confidence", sa.Float(), default=0.0),
        sa.Column("module_source", sa.String(50), nullable=False),
        sa.Column("incident_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_telemetry_timestamp", "telemetry_events", ["timestamp"])
    op.create_index("idx_telemetry_type_severity", "telemetry_events", ["event_type", "severity"])

    # Entities
    op.create_table(
        "entities",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("label", sa.String(500), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("first_seen", sa.DateTime(timezone=True)),
        sa.Column("last_seen", sa.DateTime(timezone=True)),
        sa.Column("trust_score", sa.Integer(), default=100),
        sa.Column("risk_score", sa.Integer(), default=0),
        sa.Column("status", sa.String(50), default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_entity_type_status", "entities", ["entity_type", "status"])

    # Relationships
    op.create_table(
        "relationships",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("from_entity_id", sa.String(), nullable=False),
        sa.Column("to_entity_id", sa.String(), nullable=False),
        sa.Column("relationship_type", sa.String(50), nullable=False),
        sa.Column("label", sa.String(500), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True)),
        sa.Column("confidence", sa.Float(), default=0.0),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("source", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["from_entity_id"], ["entities.id"]),
        sa.ForeignKeyConstraint(["to_entity_id"], ["entities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Incidents
    op.create_table(
        "incidents",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("attack_chain", sa.JSON(), nullable=True),
        sa.Column("timeline", sa.JSON(), nullable=True),
        sa.Column("entities", sa.JSON(), nullable=True),
        sa.Column("narrative", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), default=0.0),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("recommended_actions", sa.JSON(), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True)),
        sa.Column("contained_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_incident_status", "incidents", ["status"])
    op.create_index("idx_incident_severity", "incidents", ["severity"])

    # Phishing Analyses
    op.create_table(
        "phishing_analyses",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("input_type", sa.String(20), default="email"),
        sa.Column("risk_score", sa.Float(), default=0.0),
        sa.Column("confidence", sa.Float(), default=0.0),
        sa.Column("threat_level", sa.String(20), default="LOW"),
        sa.Column("detected_indicators", sa.JSON(), nullable=True),
        sa.Column("urls_found", sa.JSON(), nullable=True),
        sa.Column("spoofed_domains", sa.JSON(), nullable=True),
        sa.Column("ai_explanation", sa.Text(), nullable=True),
        sa.Column("executive_summary", sa.Text(), nullable=True),
        sa.Column("recommended_actions", sa.JSON(), nullable=True),
        sa.Column("provider_used", sa.String(100), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("analysis_time_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )

    # Cloud Findings
    op.create_table(
        "cloud_findings",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("service", sa.String(100), nullable=False),
        sa.Column("finding_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("resource_name", sa.String(300), nullable=True),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("status", sa.String(30), default="OPEN"),
        sa.Column("cis_control", sa.String(100), nullable=True),
        sa.Column("remediation", sa.Text(), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True)),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )

    # User Sessions
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(100), nullable=False),
        sa.Column("user_name", sa.String(200), nullable=True),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("trust_score", sa.Integer(), default=100),
        sa.Column("risk_score", sa.Integer(), default=0),
        sa.Column("trust_level", sa.String(30), default="TRUSTED"),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("device_fingerprint", sa.String(200), nullable=True),
        sa.Column("browser", sa.String(100), nullable=True),
        sa.Column("os", sa.String(100), nullable=True),
        sa.Column("login_time", sa.DateTime(timezone=True)),
        sa.Column("last_active", sa.DateTime(timezone=True)),
        sa.Column("session_duration_minutes", sa.Integer(), default=0),
        sa.Column("anomalies", sa.JSON(), nullable=True),
        sa.Column("is_blocked", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint("id"),
    )

    # Threat Intel
    op.create_table(
        "threat_intel",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(1000), nullable=True),
        sa.Column("threat_type", sa.String(50), nullable=True),
        sa.Column("severity", sa.String(20), default="MEDIUM"),
        sa.Column("affected_sector", sa.String(100), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True)),
        sa.Column("raw_data", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Response Actions
    op.create_table(
        "response_actions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("incident_id", sa.String(), nullable=True),
        sa.Column("action_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("status", sa.String(30), default="PENDING"),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_value", sa.String(500), nullable=True),
        sa.Column("confidence", sa.Float(), default=0.0),
        sa.Column("initiated_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("response_actions")
    op.drop_table("threat_intel")
    op.drop_table("user_sessions")
    op.drop_table("cloud_findings")
    op.drop_table("phishing_analyses")
    op.drop_table("incidents")
    op.drop_index("idx_incident_severity")
    op.drop_index("idx_incident_status")
    op.drop_table("relationships")
    op.drop_table("entities")
    op.drop_index("idx_entity_type_status")
    op.drop_table("telemetry_events")
    op.drop_index("idx_telemetry_type_severity")
    op.drop_index("idx_telemetry_timestamp")
