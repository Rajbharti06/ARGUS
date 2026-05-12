"""
ARGUS — Real-time Telemetry Service
Gathers local system signals using psutil.
"""

import psutil
import platform
from datetime import datetime
from typing import List, Dict, Any

class TelemetryService:
    @staticmethod
    def get_system_stats() -> Dict[str, Any]:
        """Returns high-level system metrics."""
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        
        return {
            "cpu_usage": cpu,
            "memory_usage": mem.percent,
            "disk_usage": disk.percent,
            "timestamp": datetime.now().isoformat(),
            "os": platform.system(),
            "active_processes": len(psutil.pids())
        }

    @staticmethod
    def get_suspicious_processes() -> List[Dict[str, Any]]:
        """Identifies processes that match known suspicious patterns or high resource usage."""
        suspicious = []
        FLAGGED_NAMES = {
            "powershell.exe", "cmd.exe", "wscript.exe", "cscript.exe",
            "nc.exe", "nmap.exe", "bash", "nc", "nmap", "mshta.exe",
            "regsvr32.exe", "rundll32.exe", "wmic.exe", "curl.exe", "wget.exe"
        }
        
        for proc in psutil.process_iter(["pid", "name", "username", "cpu_percent", "memory_percent", "create_time"]):
            try:
                info = proc.info
                name = (info.get("name") or "").lower()
                
                # Rule 1: Flagged name
                is_flagged = any(f in name for f in FLAGGED_NAMES)
                
                # Rule 2: High CPU (anomaly)
                high_cpu = info.get("cpu_percent", 0) > 50.0
                
                if is_flagged or high_cpu:
                    suspicious.append({
                        "pid": info["pid"],
                        "name": info["name"],
                        "user": info["username"],
                        "cpu": info["cpu_percent"],
                        "mem": round(info["memory_percent"], 2),
                        "reason": "Flagged process name" if is_flagged else "Abnormal CPU usage",
                        "timestamp": datetime.fromtimestamp(info["create_time"]).isoformat()
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return sorted(suspicious, key=lambda x: x["cpu"], reverse=True)

    @staticmethod
    def get_network_connections() -> List[Dict[str, Any]]:
        """Scans for established network connections, flagging external and non-standard ports."""
        connections = []
        SUSPICIOUS_PORTS = {4444, 6667, 1337, 31337, 9001, 9002, 4433, 8080}
        
        for conn in psutil.net_connections(kind="inet"):
            if conn.status == "ESTABLISHED" and conn.raddr:
                remote_ip = conn.raddr.ip
                remote_port = conn.raddr.port
                
                # Ignore local/internal traffic for risk flagging
                is_internal = remote_ip.startswith(("127.", "192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.30.", "172.31.", "::1"))
                
                risk = "LOW"
                if not is_internal:
                    if remote_port in SUSPICIOUS_PORTS:
                        risk = "CRITICAL"
                    else:
                        risk = "MEDIUM"
                
                connections.append({
                    "fd": conn.fd,
                    "local": f"{conn.laddr.ip}:{conn.laddr.port}",
                    "remote": f"{remote_ip}:{remote_port}",
                    "status": conn.status,
                    "pid": conn.pid,
                    "risk": risk
                })
        
        return sorted(connections, key=lambda x: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].index(x["risk"]))
