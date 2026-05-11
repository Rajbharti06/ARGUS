"""
UniShield AI — Detector Service Tests
"""

from app.services.detector import analyze_email


def test_analyze_email():
    """Test the analyze_email function."""
    # Test case 1: Safe email
    score, label, reasons = analyze_email("Hello, how are you?")
    assert score == 0
    assert label == "Safe"
    assert len(reasons) == 0

    # Test case 2: Phishing email
    score, label, reasons = analyze_email(
        "urgent action required: verify your account now at http://example.xyz"
    )
    assert score > 70
    assert label == "Phishing"
    assert len(reasons) > 0
