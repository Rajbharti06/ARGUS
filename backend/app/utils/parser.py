"""
Email parser utilities — extracts structured data from raw email text or .eml files.
"""

import re
from typing import Optional


def extract_email_parts(raw_text: str) -> dict:
    """
    Parse raw email text and extract sender, subject, body, and links.
    Handles both plain pasted email text and basic .eml format.
    """
    sender: Optional[str] = None
    subject: Optional[str] = None
    body = raw_text

    lines = raw_text.strip().split("\n")

    # Try to detect header lines (From:, Subject:, To:, Date:)
    header_end = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "":
            header_end = i + 1
            break
        if re.match(
            r"^(From|To|Subject|Date|Reply-To|Cc|Bcc):", stripped, re.IGNORECASE
        ):
            if stripped.lower().startswith("from:"):
                sender = stripped.split(":", 1)[1].strip()
            elif stripped.lower().startswith("subject:"):
                subject = stripped.split(":", 1)[1].strip()
            header_end = i + 1
        else:
            # No more headers
            break

    # Body is everything after headers
    body = "\n".join(lines[header_end:]).strip() if header_end > 0 else raw_text.strip()

    # Extract all links
    links = re.findall(r'https?://[^\s<>"\']+', raw_text)

    return {
        "sender": sender,
        "subject": subject,
        "body": body,
        "links": links,
        "has_headers": header_end > 0 and (sender is not None or subject is not None),
    }
