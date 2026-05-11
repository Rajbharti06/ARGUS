# ARGUS Unified System Architecture

## Overview
This document describes the unified architecture that merges:
- **VEIL + VERITAS** → Enhanced VEIL (Threat & Forensics Analysis)
- **ORACLE + GOTHAM** → Enhanced ORACLE (Correlation & Investigation)

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARGUS PLATFORM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────┐     ┌──────────────────────────────┐  │
│  │    ENHANCED VEIL MODULE         │     │   ENHANCED ORACLE MODULE   │  │
│  │  (Threat + Forensic Analysis)   │◄──► │ (Correlation + Investigation)│  │
│  │                                  │     │                              │  │
│  ├─ Input Layer                    │     ├─ Knowledge Graph Engine     │  │
│  │  • Email/SMS/URL (VEIL)        │     │  • Entity Resolution         │  │
│  │  • Media Files (VERITAS)        │     │  • Ontology Management       │  │
│  │  • Unified Upload Interface     │     │  • Temporal Versioning       │  │
│  ├─ Analysis Engine                │     ├─ Correlation Engine         │  │
│  │  • Phishing Detection           │     │  • Attack Chain Reconstruction│  │
│  │  • Media Forensics              │     │  • Multi-Source Fusion       │  │
│  │  • AI Reasoning Pipeline        │     │  • AI-Powered Narrative      │  │
│  ├─ ML Enhancement Layer           │     ├─ Visualization Layer       │  │
│  │  • Pattern Recognition          │     │  • Link Chart (Gotham-style) │  │
│  │  • Continuous Learning          │     │  • Timeline View             │  │
│  │  • Model Fine-tuning            │     │  • Tabular View              │  │
│  └─ Output Layer                   │     │  • Geospatial View           │  │
│     • Risk Scoring                 │     └─ Coordination Protocol      │  │
│     • Forensic Reports             │        • Event Bus Integration    │  │
│     • Response Recommendations     │        • State Synchronization   │  │
│                                     │        • Task Delegation          │  │
└─────────────────────────────────────┴──────────────────────────────────┘  │
                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                   COORDINATION & SYNCHRONIZATION LAYER               │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │  • Event-Driven Architecture                                          │  │
│  │  • Publish-Subscribe Pattern                                          │  │
│  │  • Shared State Management                                            │  │
│  │  • ML-Driven Decision Making                                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Enhanced VEIL Module (VEIL + VERITAS)

### Capabilities Matrix

| Feature | Original VEIL | Original VERITAS | Enhanced VEIL |
|---------|----------------|-------------------|---------------|
| Email/SMS/URL Analysis | ✅ | ❌ | ✅ |
| Phishing Detection | ✅ | ❌ | ✅ |
| Media Forensics (Images/Videos/Audio/PDF) | ❌ | ✅ | ✅ |
| Metadata Extraction | ❌ | ✅ | ✅ |
| AI-Powered Analysis | ✅ | ✅ | ✅ |
| Trust Scoring | ❌ | ✅ | ✅ |
| Risk Scoring | ✅ | ❌ | ✅ |
| Response Recommendations | ✅ | ❌ | ✅ |
| Forensic Reports | ❌ | ✅ | ✅ |
| Synthetic Detection | ❌ | ✅ | ✅ |
| C2PA Provenance | ❌ | ✅ | ✅ |

### API Design

#### Unified Upload Endpoint
```
POST /api/veil/unified-analyze
Content-Type: multipart/form-data

Parameters:
- content: string (for text/email analysis)
- file: File (for media forensics)
- analysis_type: "auto" | "text" | "media"
- provider: string (AI provider)
- api_key: string (optional)

Response:
{
  "analysis_id": "uuid",
  "analysis_type": "text" | "media" | "hybrid",
  "risk_score": 0-100,
  "trust_score": 0-100,
  "verdict": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "AUTHENTIC",
  "findings": [...],
  "forensic_report": {...},
  "recommended_actions": [...]
}
```

---

## Part 2: Enhanced ORACLE Module (ORACLE + GOTHAM)

### Capabilities Matrix

| Feature | Original ORACLE | Original GOTHAM | Enhanced ORACLE |
|---------|------------------|------------------|-----------------|
| Attack Correlation | ✅ | ❌ | ✅ |
| Timeline Generation | ✅ | ✅ | ✅ |
| AI Narrative | ✅ | ❌ | ✅ |
| Interactive Link Chart | ❌ | ✅ | ✅ |
| Entity Resolution | ❌ | ✅ | ✅ |
| Multiple View Modes | ❌ | ✅ | ✅ |
| Knowledge Graph | ❌ | ✅ | ✅ |
| Entity Detail Panels | ❌ | ✅ | ✅ |
| Search & Filter | ❌ | ✅ | ✅ |

### API Design

#### Unified Investigation Endpoint
```
POST /api/oracle/investigate
Content-Type: application/json

Parameters:
{
  "incident_id": "string",
  "data_sources": ["veil", "sentinel", "identity", "skynet"],
  "correlation_depth": "shallow" | "medium" | "deep",
  "include_entities": boolean,
  "generate_narrative": boolean
}

Response:
{
  "investigation_id": "uuid",
  "incident": {...},
  "timeline": [...],
  "entities": [...],
  "relationships": [...],
  "attack_chain": {...},
  "narrative": "string",
  "confidence": 0-100
}
```

---

## Part 3: Inter-Module Coordination Protocol

### Communication Flow

```
VEIL (detects threat)
    │
    ├─ Publishes event to Event Bus
    │
    ▼
ORACLE (receives event)
    │
    ├─ Correlates with other signals
    ├─ Updates knowledge graph
    ├─ Generates investigation
    │
    ├─ Sends insights back to VEIL
    │
    ▼
VEIL (receives insights)
    │
    ├─ Updates analysis
    ├─ Refines recommendations
    └─ Triggers response
```

### Event Schema

```typescript
interface ArgusEvent {
  id: string;
  timestamp: string;
  source: 'veil' | 'oracle' | 'sentinel' | 'identity' | 'skynet';
  type: 'threat_detected' | 'entity_identified' | 'correlation_complete' | 'response_initiated';
  payload: {
    analysis_id?: string;
    incident_id?: string;
    risk_score?: number;
    entities?: Entity[];
    findings?: Finding[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## Part 4: ML Enhancement Layer

### Continuous Learning Pipeline

1. **Data Collection**: All analyses and investigations are stored with feedback
2. **Feature Extraction**: Extract patterns from successful correlations
3. **Model Fine-Tuning**: Periodically retrain models on new data
4. **A/B Testing**: Compare old vs new model performance
5. **Deployment**: Roll out updated models with canary releases

### ML Features

- **Threat Pattern Recognition**: Identify emerging threat patterns
- **Entity Resolution Accuracy**: Improve matching of similar entities
- **Correlation Confidence**: Better scoring of attack chain likelihood
- **Response Recommendation**: Optimize playbook suggestions

---

## Database Schema (Unified)

### Entities Table
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- person, ip, domain, file, system
  label TEXT NOT NULL,
  metadata JSONB,
  first_seen TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL,
  trust_score INTEGER,
  risk_score INTEGER,
  status VARCHAR(50)
);
```

### Relationships Table
```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  from_entity UUID REFERENCES entities(id),
  to_entity UUID REFERENCES entities(id),
  type VARCHAR(50) NOT NULL,
  label TEXT,
  timestamp TIMESTAMP NOT NULL,
  confidence INTEGER,
  evidence JSONB
);
```

### Analyses Table
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY,
  source VARCHAR(50) NOT NULL, -- veil, veritas, unified
  analysis_type VARCHAR(50),
  input_data JSONB,
  results JSONB,
  risk_score INTEGER,
  trust_score INTEGER,
  created_at TIMESTAMP NOT NULL,
  feedback JSONB
);
```

### Incidents Table
```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  title TEXT,
  severity VARCHAR(20),
  timeline JSONB,
  entities JSONB,
  attack_chain JSONB,
  narrative TEXT,
  confidence INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP
);
```

---

## Backward Compatibility

### Legacy API Endpoints (Maintained)
- `POST /api/argus/veil/analyze` → maps to unified endpoint
- `POST /api/forensic/analyze` → maps to unified endpoint  
- `GET /api/argus/oracle/timeline` → maintained for backward compatibility

### Data Migration
- Existing VEIL analyses → migrated to unified analyses table
- Existing VERITAS reports → migrated to unified analyses table
- ORACLE incident data → migrated to incidents table with entity graph

---

## Deployment Architecture

### Containerization
```
argus-unified/
├── docker-compose.yml
├── services/
│   ├── veil/
│   │   └── Dockerfile
│   ├── oracle/
│   │   └── Dockerfile
│   └── coordination/
│       └── Dockerfile
└── k8s/
    ├── deployments/
    ├── services/
    └── ingress/
```

### CI/CD Pipeline
1. Code push → GitHub Actions
2. Run tests (unit, integration, E2E)
3. Build Docker images
4. Push to container registry
5. Deploy to staging
6. Run smoke tests
7. Promote to production (manual approval)

---

## Monitoring & Observability

### Metrics
- Analysis latency (VEIL)
- Correlation time (ORACLE)
- Event bus throughput
- ML model accuracy
- System uptime

### Logging
- Structured JSON logs
- Correlation IDs across services
- Audit trails for all actions
- Error tracking with Sentry

### Alerting
- Critical threats detected
- System health issues
- ML performance degradation
- Anomaly detection
