"""
Aegis X — SIFT Simulator
Simulates highly realistic forensic tool outputs for the Debate Engine.
Provides 8 attack scenarios with authentic artifact formatting.
"""

import random

SCENARIOS = {
    "malware_injection": {
        "id": "malware_injection",
        "name": "Process Hollowing (Malware Injection)",
        "description": "Suspicious process injection into explorer.exe detected in memory dump.",
        "severity": "critical",
        "mitre_tactics": ["Defense Evasion", "Privilege Escalation"],
        "expected_iocs": ["explorer.exe injected", "Cobalt Strike beacon", "185.220.101.45"],
        "forensic_data": {
            "volatility_output": """
Volatility 3 Framework 2.4.1
Progress:  100.00		PDB scanning finished                        

PID     Process         Protection      CommitCharge    PrivateMemory   FileOutput
4812    explorer.exe    False           1240            1840            Disabled

Injected Memory Regions:
Process: explorer.exe (PID: 4812)
Start: 0x0000018abc120000  End: 0x0000018abc124000  Protection: PAGE_EXECUTE_READWRITE
Start: 0x0000018abc180000  End: 0x0000018abc188000  Protection: PAGE_EXECUTE_READWRITE

Hexdump of 0x0000018abc120000:
0x0000018abc120000  fc 48 83 e4 f0 e8 cc 00 00 00 41 51 41 50 52 51  .H........AQAPRQ
0x0000018abc120010  56 48 31 d2 65 48 8b 52 60 48 8b 52 18 48 8b 52  VH1.eH.R`H.R.H.R
0x0000018abc120020  20 48 8b 72 50 48 0f b7 4a 4a 4d 31 c9 48 31 c0   H.rPH..JJM1.H1.
""",
            "network_logs": """
Zeek conn.log excerpt:
#fields ts uid id.orig_h id.orig_p id.resp_h id.resp_p proto service duration orig_bytes resp_bytes conn_state
1715243105.14 C2ab3d 10.0.4.23 49152 185.220.101.45 443 tcp ssl 3600.0 14502 48920 OTH
1715246705.18 C9xf1a 10.0.4.23 49153 185.220.101.45 443 tcp ssl 3600.0 14890 51200 OTH

Suricata Fast Log:
05/09/2026-10:25:05.140000  [**] [1:2024181:2] ET MALWARE Cobalt Strike Beacon Observed [**] [Classification: A Network Trojan was detected] [Priority: 1] {TCP} 10.0.4.23:49152 -> 185.220.101.45:443
""",
            "yara_matches": """
Rule: CobaltStrike_Beacon_Memory
Target: memory_dump_pid4812.dmp
Offset: 0x18abc120000
Match: $mz = "MZ"
Match: $shellcode = { fc 48 83 e4 f0 e8 }
""",
            "disk_artifacts": """
Registry Key: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater
Value: "C:\\Users\\admin\\AppData\\Local\\Temp\\update.exe"
Creation Time: 2026-05-09 10:20:15 UTC
"""
        },
        "hint_for_hunter": "Focus on the PAGE_EXECUTE_READWRITE memory regions and the Suricata alert for Cobalt Strike.",
        "false_positive_risk": "Legitimate JIT compilers or security tools might allocate RWX memory, but the network C2 traffic strongly suggests true positive."
    },
    
    "ransomware_precursor": {
        "id": "ransomware_precursor",
        "name": "Ransomware Precursor Activity",
        "description": "Lateral movement and shadow copy deletion detected.",
        "severity": "critical",
        "mitre_tactics": ["Lateral Movement", "Impact"],
        "expected_iocs": ["vssadmin.exe delete shadows", "Mimikatz lsass dump", "Mass SMB connections"],
        "forensic_data": {
            "windows_events": """
Event ID: 4688 (Process Creation)
Time: 2026-05-10 03:14:22 UTC
Process: C:\Windows\System32\vssadmin.exe
Command Line: vssadmin.exe delete shadows /all /quiet
Account: WORKGROUP\SYSTEM

Event ID: 4688 (Process Creation)
Time: 2026-05-10 03:15:01 UTC
Process: C:\\Users\public\Downloads\m64.exe
Command Line: m64.exe privilege::debug sekurlsa::logonpasswords exit
Account: DOMAIN\Administrator
""",
            "network_logs": """
Zeek smb_files.log excerpt:
#fields ts uid id.orig_h id.resp_h action path name
1715310920.01 Cu281b 10.1.2.45 10.1.2.100 SMB::FILE_READ \\\\10.1.2.100\\ADMIN$ lsass.dmp
1715310925.14 Cu281c 10.1.2.45 10.1.2.101 SMB::FILE_WRITE \\\\10.1.2.101\\C$ \Temp\payload.dll
1715310925.80 Cu281d 10.1.2.45 10.1.2.102 SMB::FILE_WRITE \\\\10.1.2.102\\C$ \Temp\payload.dll
1715310926.11 Cu281e 10.1.2.45 10.1.2.103 SMB::FILE_WRITE \\\\10.1.2.103\\C$ \Temp\payload.dll
""",
            "disk_artifacts": """
File accessed: C:\Windows\System32\lsass.exe
Access type: ReadProcessMemory (Handle requested: 0x1FFFFF)
Requesting Process: C:\\Users\public\Downloads\m64.exe (PID: 8192)
""",
            "timeline": """
[2026-05-10 03:12:05] User 'Administrator' logged in via RDP from 10.1.2.45
[2026-05-10 03:13:10] File creation: C:\\Users\public\Downloads\m64.exe
[2026-05-10 03:14:22] Process executed: vssadmin.exe delete shadows
[2026-05-10 03:15:01] Process executed: m64.exe (Mimikatz execution)
[2026-05-10 03:15:20] Outbound SMB connections to 15 internal hosts
"""
        },
        "hint_for_hunter": "Correlate the shadow copy deletion with the Mimikatz execution and outbound SMB spray.",
        "false_positive_risk": "vssadmin is sometimes used by legitimate backup software, but not typically accompanied by Mimikatz commands."
    },

    "apt_exfiltration": {
        "id": "apt_exfiltration",
        "name": "APT Data Exfiltration",
        "description": "DNS tunneling and HTTPS exfiltration to suspicious domain.",
        "severity": "high",
        "mitre_tactics": ["Exfiltration", "Command and Control"],
        "expected_iocs": ["High-entropy DNS TXT queries", "2.4GB staging archive", "Scheduled task persistence"],
        "forensic_data": {
            "network_logs": """
Zeek dns.log excerpt:
#fields ts uid id.orig_h id.resp_h proto query qtype answers
1715420100.10 Cd81b 10.0.5.55 8.8.8.8 udp a3f8b9c2d1.bad-domain.xyz TXT "b64:SGVsbG8gV29ybGQ="
1715420101.20 Cd81c 10.0.5.55 8.8.8.8 udp f9e8d7c6b5.bad-domain.xyz TXT "b64:U2VjcmV0IERhdGE="
1715420102.30 Cd81d 10.0.5.55 8.8.8.8 udp 1a2b3c4d5e.bad-domain.xyz TXT "b64:RXhmaWx0cmF0aW9u"
(Over 5,000 similar TXT queries in 10 minutes)

Zeek ssl.log excerpt:
#fields ts id.orig_h id.resp_h server_name issuer subject
1715421500.00 10.0.5.55 198.51.100.22 backup.bad-domain.xyz Let's Encrypt Authority X3 backup.bad-domain.xyz
""",
            "disk_artifacts": """
Staging file detected:
Path: C:\\ProgramData\\Microsoft\\Network\\stage.rar
Size: 2458901200 bytes (2.4 GB)
Entropy: 7.99 (Highly compressed/encrypted)
Created: 2026-05-11 08:15:00 UTC
""",
            "windows_events": """
Event ID: 4698 (A scheduled task was created)
Time: 2026-05-11 08:10:00 UTC
Task Name: \\Microsoft\\Windows\\Customer Experience Improvement Program\\Consolidator_Update
Action: C:\\Windows\\System32\\cmd.exe /c "powershell -ep bypass -f C:\\ProgramData\\Microsoft\\Network\\sync.ps1"
Account: SYSTEM
""",
            "yara_matches": """
Rule: Suspicious_RAR_Archive
Target: C:\\ProgramData\\Microsoft\\Network\\stage.rar
Match: File header matches RAR signature (Rar!\x1a\x07\x00)
"""
        },
        "hint_for_hunter": "Link the creation of the 2.4GB archive with the high volume of DNS TXT queries and the scheduled task.",
        "false_positive_risk": "Legitimate software updates or syncing services might create large archives, but DNS TXT tunneling is highly anomalous."
    },

    "insider_threat": {
        "id": "insider_threat",
        "name": "Insider Threat Data Theft",
        "description": "Privileged user performing bulk download and USB transfer after hours.",
        "severity": "high",
        "mitre_tactics": ["Collection", "Exfiltration"],
        "expected_iocs": ["1247 files accessed", "USB device inserted", "Off-hours activity"],
        "forensic_data": {
            "windows_events": """
Event ID: 4624 (Logon)
Time: 2026-05-12 02:30:15 UTC (Off-hours)
Account: j.doe (Research Lead)
Logon Type: 2 (Interactive)

Event ID: 6416 (A new external device was recognized)
Time: 2026-05-12 02:45:00 UTC
Device Name: USB Mass Storage Device
Device ID: USB\VID_0781&PID_5581\01017e4bbdfb23114a1a67a685

Event ID: 4663 (An attempt was made to access an object)
Time: 2026-05-12 02:50:00 - 02:56:00 UTC
Object Name: D:\Research_Data\Project_X\*
Accesses: ReadData (1247 occurrences)
Account: j.doe
""",
            "timeline": """
[02:30:15] User j.doe logs in locally.
[02:45:00] USB drive (SanDisk Cruzer) connected. Volume assigned: E:
[02:50:00] Explorer.exe starts reading files from D:\Research_Data\Project_X\
[02:56:00] 1247 files (Total ~8.5GB) read from D:
[02:56:15] Write operations observed on Volume E: matching sizes of read files.
[03:10:00] USB drive disconnected (Safely Remove Hardware).
[03:15:00] User j.doe logs off.
""",
            "network_logs": """
No significant external network activity during this window.
""",
            "disk_artifacts": """
Prefetch analysis:
EXPLORER.EXE - Execution time correlates with file access events.
No unusual processes executed.
"""
        },
        "hint_for_hunter": "Highlight the off-hours interactive login, USB insertion, and the massive read volume corresponding to writes on the USB volume.",
        "false_positive_risk": "Could be a legitimate backup by the researcher, but doing it manually at 2:30 AM to a personal USB drive violates typical data handling policies."
    },

    "credential_harvest": {
        "id": "credential_harvest",
        "name": "AiTM Phishing & Token Replay",
        "description": "Adversary-in-the-Middle attack capturing session tokens.",
        "severity": "critical",
        "mitre_tactics": ["Credential Access", "Defense Evasion"],
        "expected_iocs": ["Evilginx proxy signatures", "Token replay from anomalous IP", "MFA bypassed"],
        "forensic_data": {
            "network_logs": """
Suricata Fast Log:
05/13/2026-14:20:00.000  [**] [1:2034567:1] ET PHISHING Suspected Evilginx/Modlishka AiTM Proxy Framework [**] [Classification: A Network Trojan was detected] [Priority: 1] {TCP} 10.0.10.50:54321 -> 198.51.100.88:443

Proxy Logs (SSO Portal):
14:20:05 - User: a.smith - IP: 10.0.10.50 (Internal) - Action: Successful Login (MFA satisfied) - User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0
14:25:30 - User: a.smith - IP: 203.0.113.45 (External - RU) - Action: Session Resumed (Token validated) - User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0
""",
            "application_logs": """
SSO Identity Provider Audit:
Event: Token Validation
Time: 14:25:30 UTC
User: a.smith
Token ID: eyJhbGciOiJIUzI1...
Result: SUCCESS (No MFA prompted - session already authenticated)
Location: Moscow, Russia (Anomalous travel: 8000 miles in 5 minutes)
""",
            "windows_events": """
Event ID: 4624 (Logon)
Time: 14:25:35 UTC
Account: a.smith
Logon Type: 3 (Network)
Source Network Address: 203.0.113.45
"""
        },
        "hint_for_hunter": "Connect the Suricata AiTM alert with the impossible travel session resumption using the exact same session token.",
        "false_positive_risk": "VPN usage can sometimes look like impossible travel, but it shouldn't trigger an AiTM proxy signature."
    },

    "supply_chain": {
        "id": "supply_chain",
        "name": "Supply Chain Trojan",
        "description": "Trusted vendor software update contains embedded backdoor.",
        "severity": "critical",
        "mitre_tactics": ["Initial Access", "Execution", "Persistence"],
        "expected_iocs": ["Valid signature on malicious binary", "DLL sideloading", "Unexpected C2 traffic"],
        "forensic_data": {
            "disk_artifacts": """
File: C:\Program Files\VendorApp\\update_v2.4.exe
Signature Status: VALID (Signed by "Vendor Software Inc.")
Counter Signature: VALID (DigiCert Timestamp)
Compilation Time: 2026-05-14 09:00:00 UTC

File: C:\Program Files\VendorApp\libcrypto.dll
Signature Status: INVALID / UNSIGNED
Creation Time: 2026-05-14 10:15:22 UTC (Dropped by update_v2.4.exe)
""",
            "windows_events": """
Event ID: 7 (Image loaded) - Sysmon
Time: 2026-05-14 10:15:25 UTC
Image: C:\Program Files\VendorApp\VendorApp.exe
ImageLoaded: C:\Program Files\VendorApp\libcrypto.dll
SignatureStatus: Unsigned

Event ID: 11 (FileCreate) - Sysmon
Time: 2026-05-14 10:15:22 UTC
Process: C:\Program Files\VendorApp\\update_v2.4.exe
TargetFilename: C:\Program Files\VendorApp\libcrypto.dll
""",
            "network_logs": """
Zeek conn.log excerpt:
1715681730.00 C8x2z 10.0.2.15 50123 93.184.216.34 443 tcp ssl 120.5 450 3200 OTH
Process associated: VendorApp.exe
Destination: update-telemetry.bad-actor.net (Not the official vendor domain)
"""
        },
        "hint_for_hunter": "Identify the DLL sideloading attack where a trusted signed executable drops and loads an unsigned malicious DLL.",
        "false_positive_risk": "Some poorly written legitimate software drops unsigned DLLs, but network traffic to an unknown domain is highly suspicious."
    },

    "cloud_breach": {
        "id": "cloud_breach",
        "name": "AWS Infrastructure Breach",
        "description": "Cloud API keys compromised, leading to S3 bucket exposure.",
        "severity": "critical",
        "mitre_tactics": ["Initial Access", "Privilege Escalation", "Impact"],
        "expected_iocs": ["GetCallerIdentity from anomalous IP", "PutBucketAcl to public", "CreateAccessKey"],
        "forensic_data": {
            "cloud_logs": """
AWS CloudTrail Logs:
Time: 2026-05-15 11:00:00 UTC
EventName: GetCallerIdentity
UserIdentity: arn:aws:iam::123456789012:user/dev_user
SourceIPAddress: 45.33.22.11 (Known Tor Exit Node)

Time: 2026-05-15 11:05:00 UTC
EventName: AttachUserPolicy
UserIdentity: arn:aws:iam::123456789012:user/dev_user
RequestParameters: policyArn="arn:aws:iam::aws:policy/AdministratorAccess", userName="dev_user"
SourceIPAddress: 45.33.22.11

Time: 2026-05-15 11:10:00 UTC
EventName: PutBucketAcl
UserIdentity: arn:aws:iam::123456789012:user/dev_user
RequestParameters: bucketName="company-customer-pii-data", accessControlPolicy="PublicRead"
SourceIPAddress: 45.33.22.11
""",
            "network_logs": """
N/A - Control plane activity only.
""",
            "yara_matches": """
N/A
"""
        },
        "hint_for_hunter": "Trace the sequence from initial recon (GetCallerIdentity) via Tor, to privilege escalation, to the impact action (making the PII bucket public).",
        "false_positive_risk": "Zero. Legitimate developers do not use Tor to attach AdministratorAccess and make PII buckets public."
    },

    "zero_day_exploit": {
        "id": "zero_day_exploit",
        "name": "Kernel Rootkit / Zero-Day",
        "description": "Advanced kernel exploitation bypassing standard protections.",
        "severity": "critical",
        "mitre_tactics": ["Execution", "Privilege Escalation", "Defense Evasion"],
        "expected_iocs": ["Hidden processes via DKOM", "SMEP bypass", "Unbacked executable memory"],
        "forensic_data": {
            "volatility_output": """
Volatility 3 Framework 2.4.1
Progress:  100.00		PDB scanning finished

Plugin: pslist vs psscan (Process Cross-View)
pslist (Active Process Links):
PID 1000 - svchost.exe
PID 1024 - explorer.exe

psscan (Pool Tag Scanning):
PID 1000 - svchost.exe
PID 1024 - explorer.exe
PID 31337 - hidden_agent.exe  <-- HIDDEN (DKOM detected)

Plugin: modscan (Kernel Modules)
Module Name: nvlddmkm.sys (Spoofed name)
Base Address: 0xFFFFF80540000000
Size: 0x4000
Linked: False (Hidden from module list)

Plugin: malfind
Process: hidden_agent.exe (PID: 31337)
Start: 0x0000020000000000  End: 0x0000020000010000  Protection: PAGE_EXECUTE_READWRITE
Hexdump:
0x0000020000000000  48 8b 04 25 88 01 00 00 48 8b 80 b8 00 00 00 48  H..%....H......H
""",
            "windows_events": """
Event ID: 4688 (Process Creation)
Time: 2026-05-16 22:00:00 UTC
Process: C:\Windows\Temp\exploit.exe
Command Line: exploit.exe
Account: WORKGROUP\\user

(No subsequent events for hidden_agent.exe due to kernel-level event suppression)
""",
            "disk_artifacts": """
File: C:\Windows\System32\drivers\\nvlddmkm.sys (Legitimate NVIDIA driver)
File: C:\Windows\Temp\\nvlddmkm.sys (Malicious rootkit payload)
"""
        },
        "hint_for_hunter": "Identify the Direct Kernel Object Manipulation (DKOM) by comparing pslist and psscan outputs to find the hidden process.",
        "false_positive_risk": "Cross-view discrepancies can sometimes happen if a process exits during memory acquisition, but unlinked kernel modules are highly suspicious."
    }
}

def list_scenarios() -> list:
    """Return a list of available scenarios with metadata."""
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"],
            "severity": s["severity"]
        } for s in SCENARIOS.values()
    ]

def get_scenario(scenario_id: str) -> dict:
    """Get full scenario data by ID."""
    return SCENARIOS.get(scenario_id)

def get_random_scenario() -> dict:
    """Return a random scenario."""
    return random.choice(list(SCENARIOS.values()))
