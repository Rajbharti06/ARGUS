"""
UniShield AI — Engine Service Tests
"""

from unittest.mock import patch
from app.core.engine import run_analysis


@patch("app.core.engine.AIRouter")
@patch("app.core.engine.analyze_email")
def test_run_analysis(mock_analyze_email, mock_ai_router):
    """Test the run_analysis function."""
    mock_analyze_email.return_value = (
        80,
        "Phishing",
        ["Suspicious domain detected: .xyz"],
    )
    mock_ai_router.return_value.generate.return_value = "This is a test explanation."

    result = run_analysis("test@example.com", "openai", "test_key")

    assert result["score"] == 80
    assert result["label"] == "Phishing"
    assert result["reasons"] == ["Suspicious domain detected: .xyz"]
    assert result["explanation"] == "This is a test explanation."
