"""
ARGUS — Main Application Tests
"""

from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "ARGUS — Autonomous Cyber Defense Intelligence Platform",
        "version": "3.0.0",
    }
