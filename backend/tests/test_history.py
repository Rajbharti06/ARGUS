"""
UniShield AI — History Endpoint Tests
"""

from fastapi.testclient import TestClient
from unittest.mock import patch


@patch("app.routes.scan.run_analysis")
def test_get_history(mock_run_analysis, client: TestClient):
    """Test the get history endpoint."""
    # First, add something to the history
    mock_run_analysis.return_value = {
        "score": 80,
        "label": "Phishing",
        "reasons": ["Suspicious domain detected: .xyz"],
        "explanation": "This is a test explanation.",
    }
    client.post(
        "/scan/email",
        json={"email": "test@example.com", "api_key": "test_key"},
    )

    # Then, get the history
    response = client.get("/history/")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["label"] == "Phishing"
