"""
UniShield AI — Scan Endpoint Tests
"""

from fastapi.testclient import TestClient
from unittest.mock import patch


@patch("app.routes.scan.run_analysis")
def test_scan_email(mock_run_analysis, client: TestClient):
    """Test the scan email endpoint."""
    mock_run_analysis.return_value = {
        "score": 80,
        "label": "Phishing",
        "reasons": ["Suspicious domain detected: .xyz"],
        "explanation": "This is a test explanation.",
    }

    response = client.post(
        "/scan/email",
        json={"email": "test@example.com", "api_key": "test_key"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "score": 80,
        "label": "Phishing",
        "reasons": ["Suspicious domain detected: .xyz"],
        "explanation": "This is a test explanation.",
    }
