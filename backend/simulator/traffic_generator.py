"""
NetShield AI — Realistic Network Traffic Simulator
Generates NSG Flow Log format data with:
  - Normal HTTPS/HTTP traffic
  - SSH Brute Force attacks
  - Port Scan patterns
  - DDoS-like traffic spikes
  - Suspicious foreign IPs

Also pushes logs to Azure Log Analytics Workspace
"""

import os
import json
import random
import time
import requests
import hashlib
import hmac
import base64
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ─── Azure Config ─────────────────────────────────────────────────
WORKSPACE_ID  = os.getenv("LOG_ANALYTICS_WORKSPACE_ID")
PRIMARY_KEY   = os.getenv("LOG_ANALYTICS_PRIMARY_KEY")
LOG_TYPE      = "NetShieldTrafficLogs"   # Custom log table name in Azure

# ─── IP Pools ─────────────────────────────────────────────────────
NORMAL_IPS = [
    "192.168.1.10", "192.168.1.20", "192.168.1.30",
    "10.0.1.5",     "10.0.1.15",    "10.0.2.5",
    "172.16.0.10",  "172.16.0.20",
]

SUSPICIOUS_IPS = [
    "103.45.67.89",  "185.220.101.45", "45.33.32.156",
    "198.199.88.24", "167.99.120.44",  "104.131.0.69",
    "178.128.48.56", "134.209.82.14",
]

KNOWN_MALICIOUS_IPS = [
    "194.165.16.72",  "91.92.109.196",  "185.224.128.43",
    "192.241.220.48", "45.142.212.100",
]

INTERNAL_IPS = ["10.0.1.4", "10.0.1.5", "10.0.2.4", "172.16.0.1"]

COUNTRIES = {
    "192.168.": "Internal", "10.0.": "Internal", "172.16.": "Internal",
    "103.45.": "India",     "185.220.": "Russia",  "45.33.": "USA",
    "198.199.": "USA",      "167.99.": "Germany",  "104.131.": "USA",
    "178.128.": "Singapore","134.209.": "India",   "194.165.": "Iran",
    "91.92.":   "Netherlands","185.224.": "Ukraine","192.241.": "USA",
    "45.142.":  "Germany",
}

PROTOCOLS   = ["TCP", "UDP", "ICMP"]
COMMON_PORTS = [80, 443, 8080, 8443, 3000, 5000]
RISKY_PORTS  = [22, 23, 3389, 1433, 3306, 5432]


# ─── Helpers ──────────────────────────────────────────────────────
def get_country(ip: str) -> str:
    for prefix, country in COUNTRIES.items():
        if ip.startswith(prefix):
            return country
    return "Unknown"


def random_ip_from(pool):
    return random.choice(pool)


def make_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ─── Traffic Generators ───────────────────────────────────────────
def generate_normal_traffic(count: int = 1) -> list:
    """Normal HTTPS / HTTP traffic"""
    logs = []
    for _ in range(count):
        src = random_ip_from(NORMAL_IPS)
        logs.append({
            "source_ip":    src,
            "dest_ip":      random_ip_from(INTERNAL_IPS),
            "source_port":  random.randint(49152, 65535),
            "dest_port":    random.choice(COMMON_PORTS),
            "protocol":     "TCP",
            "action":       "ALLOW",
            "bytes_sent":   random.randint(200, 5000),
            "packets":      random.randint(3, 20),
            "flow_type":    "normal",
            "country":      get_country(src),
            "timestamp":    make_timestamp(),
        })
    return logs


def generate_brute_force(src_ip: str = None, count: int = 50) -> list:
    """SSH Brute Force: same IP hammering port 22 repeatedly"""
    src = src_ip or random_ip_from(SUSPICIOUS_IPS)
    logs = []
    for _ in range(count):
        logs.append({
            "source_ip":    src,
            "dest_ip":      random_ip_from(INTERNAL_IPS),
            "source_port":  random.randint(1024, 65535),
            "dest_port":    22,
            "protocol":     "TCP",
            "action":       "DENY",
            "bytes_sent":   random.randint(40, 200),
            "packets":      random.randint(1, 3),
            "flow_type":    "brute_force",
            "country":      get_country(src),
            "timestamp":    make_timestamp(),
        })
    return logs


def generate_port_scan(src_ip: str = None, count: int = 30) -> list:
    """Port Scan: one IP sweeping many ports sequentially"""
    src = src_ip or random_ip_from(SUSPICIOUS_IPS)
    logs = []
    for port in range(20, 20 + count):
        logs.append({
            "source_ip":    src,
            "dest_ip":      random_ip_from(INTERNAL_IPS),
            "source_port":  random.randint(1024, 65535),
            "dest_port":    port,
            "protocol":     "TCP",
            "action":       "DENY",
            "bytes_sent":   random.randint(40, 100),
            "packets":      1,
            "flow_type":    "port_scan",
            "country":      get_country(src),
            "timestamp":    make_timestamp(),
        })
    return logs


def generate_ddos(src_ips: list = None, count: int = 100) -> list:
    """DDoS: multiple IPs flooding same destination"""
    sources = src_ips or KNOWN_MALICIOUS_IPS
    dest    = random_ip_from(INTERNAL_IPS)
    logs    = []
    for _ in range(count):
        src = random.choice(sources)
        logs.append({
            "source_ip":    src,
            "dest_ip":      dest,
            "source_port":  random.randint(1024, 65535),
            "dest_port":    random.choice([80, 443]),
            "protocol":     "TCP",
            "action":       random.choice(["ALLOW", "DENY"]),
            "bytes_sent":   random.randint(1000, 65000),
            "packets":      random.randint(50, 500),
            "flow_type":    "ddos",
            "country":      get_country(src),
            "timestamp":    make_timestamp(),
        })
    return logs


def generate_mixed_batch(
    normal: int = 80,
    brute_force: int = 1,
    port_scan: int = 1,
    ddos: int = 0,
) -> list:
    """
    Generate a realistic mixed batch of traffic logs.
    Default: mostly normal with occasional attacks.
    """
    logs = []
    logs.extend(generate_normal_traffic(normal))

    for _ in range(brute_force):
        logs.extend(generate_brute_force(count=random.randint(20, 60)))

    for _ in range(port_scan):
        logs.extend(generate_port_scan(count=random.randint(15, 40)))

    for _ in range(ddos):
        logs.extend(generate_ddos(count=random.randint(50, 150)))

    random.shuffle(logs)
    return logs


# ─── Azure Log Analytics Ingestion ────────────────────────────────
def build_signature(workspace_id: str, key: str, date: str,
                    content_length: int, method: str,
                    content_type: str, resource: str) -> str:
    """Build HMAC-SHA256 signature for Azure Log Analytics API"""
    x_headers   = f"x-ms-date:{date}"
    string_to_hash = f"{method}\n{content_length}\n{content_type}\n{x_headers}\n{resource}"
    bytes_to_hash  = string_to_hash.encode("utf-8")
    decoded_key    = base64.b64decode(key)
    encoded_hash   = base64.b64encode(
        hmac.new(decoded_key, bytes_to_hash, digestmod=hashlib.sha256).digest()
    ).decode("utf-8")
    return f"SharedKey {workspace_id}:{encoded_hash}"


def push_to_log_analytics(logs: list) -> bool:
    """Push a batch of logs to Azure Log Analytics Workspace"""
    if not WORKSPACE_ID or not PRIMARY_KEY:
        print("[WARN] No Azure credentials — skipping cloud push (local only)")
        return False

    body         = json.dumps(logs)
    method       = "POST"
    content_type = "application/json"
    resource     = "/api/logs"
    rfc1123date  = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
    content_len  = len(body)

    signature = build_signature(
        WORKSPACE_ID, PRIMARY_KEY, rfc1123date,
        content_len, method, content_type, resource
    )

    uri = (
        f"https://{WORKSPACE_ID}.ods.opinsights.azure.com"
        f"{resource}?api-version=2016-04-01"
    )

    headers = {
        "Content-Type":  content_type,
        "Authorization": signature,
        "Log-Type":      LOG_TYPE,
        "x-ms-date":     rfc1123date,
        "time-generated-field": "timestamp",
    }

    try:
        response = requests.post(uri, data=body, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"[OK] Pushed {len(logs)} logs to Azure Log Analytics")
            return True
        else:
            print(f"[ERROR] Azure push failed: {response.status_code} — {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Azure connection error: {e}")
        return False


# ─── Main Runner ──────────────────────────────────────────────────
if __name__ == "__main__":
    print("[START] NetShield Traffic Simulator Starting...")
    print(f"   Workspace ID : {WORKSPACE_ID}")
    print()

    rounds = 3
    for i in range(1, rounds + 1):
        print(f"--- Round {i}/{rounds} ---------------------")

        batch = generate_mixed_batch(
            normal=70,
            brute_force=random.randint(1, 3),
            port_scan=random.randint(0, 2),
            ddos=random.randint(0, 1),
        )

        print(f"   Generated : {len(batch)} log entries")
        print(f"   Breakdown :")
        from collections import Counter
        flow_counts = Counter(log["flow_type"] for log in batch)
        for ftype, cnt in flow_counts.items():
            print(f"     * {ftype:<15} {cnt} entries")

        # Push to Azure
        push_to_log_analytics(batch)

        # Save locally as JSON for backend use
        with open(f"simulator_output_round_{i}.json", "w") as f:
            json.dump(batch, f, indent=2)
        print(f"   Saved      : simulator_output_round_{i}.json")

        if i < rounds:
            print("   Waiting 5 seconds...")
            time.sleep(5)

    print()
    print("[OK] Simulation complete!")
    print("   Check your Azure Log Analytics Workspace for incoming data.")
    print("   Local JSON files saved for backend development.")
