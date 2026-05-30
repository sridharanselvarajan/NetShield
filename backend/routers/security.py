"""
NetShield AI — Security Routers
Exposes endpoints for querying traffic logs, anomalies, and active alerts.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio
import json
import random
import os
import joblib
import pandas as pd
import numpy as np
import hmac
import hashlib
import base64
import requests

from models.database import get_db, TrafficLog, Alert, Anomaly, SessionLocal, FirewallRule
from models import schemas
from routers.auth import RoleChecker

router = APIRouter(prefix="/api/security", tags=["Security Operations"])

# ─── Traffic Logs Endpoint ──────────────────────────────────────────
@router.get("/logs", response_model=List[schemas.TrafficLogOut])
def get_traffic_logs(
    limit: int = 100,
    offset: int = 0,
    flow_type: Optional[str] = None,
    threat_level: Optional[str] = None,
    is_anomaly: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TrafficLog)
    
    if flow_type:
        query = query.filter(TrafficLog.flow_type == flow_type)
    if threat_level:
        query = query.filter(TrafficLog.threat_level == threat_level)
    if is_anomaly is not None:
        query = query.filter(TrafficLog.is_anomaly == is_anomaly)
        
    logs = query.order_by(TrafficLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs

# ─── Prune Old Logs Endpoint ────────────────────────────────────────
@router.delete("/logs/purge")
def purge_old_logs(limit: int = 100, db: Session = Depends(get_db)):
    # Find the oldest 100 log entries (ascending order of timestamp or ID)
    oldest_logs = db.query(TrafficLog).order_by(TrafficLog.id.asc()).limit(limit).all()
    if not oldest_logs:
        return {"message": "No logs to purge", "count": 0}
        
    purged_count = 0
    for log in oldest_logs:
        db.delete(log)
        purged_count += 1
        
    db.commit()
    print(f"[CLEANUP] Pruned oldest {purged_count} traffic logs from SQLite database.")
    return {"message": f"Successfully purged oldest {purged_count} logs", "count": purged_count}

# ─── Active Alerts Endpoint ─────────────────────────────────────────
@router.get("/alerts", response_model=List[schemas.AlertOut])
def get_active_alerts(
    unresolved_only: bool = True,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if unresolved_only:
        query = query.filter(Alert.is_resolved == False)
    return query.order_by(Alert.timestamp.desc()).limit(limit).all()

@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int, 
    db: Session = Depends(get_db), 
    current_user: str = Depends(RoleChecker(["admin"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    db.commit()
    return {"message": f"Alert {alert_id} successfully marked as resolved"}

@router.post("/alerts/resolve-all")
def resolve_all_alerts(
    db: Session = Depends(get_db), 
    current_user: str = Depends(RoleChecker(["admin"]))
):
    unresolved_alerts = db.query(Alert).filter(Alert.is_resolved == False).all()
    for a in unresolved_alerts:
        a.is_resolved = True
    db.commit()
    print("[CLEANUP] Successfully resolved all active alerts in SQLite.")
    return {"message": "All alerts successfully marked as resolved"}

# ─── Anomalies Endpoint ─────────────────────────────────────────────
@router.get("/anomalies", response_model=List[schemas.AnomalyOut])
def get_anomalies(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Anomaly).order_by(Anomaly.timestamp.desc()).limit(limit).all()

# ─── Dashboard Statistics ──────────────────────────────────────────
@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    # 1. Total counts
    total_traffic = db.query(TrafficLog).count()
    total_threats = db.query(TrafficLog).filter(TrafficLog.flow_type != "normal").count()
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    anomaly_count = db.query(TrafficLog).filter(TrafficLog.is_anomaly == True).count()
    
    # 2. Alerts by Severity
    critical_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_resolved == False).count()
    high_alerts = db.query(Alert).filter(Alert.severity == "HIGH", Alert.is_resolved == False).count()
    medium_alerts = db.query(Alert).filter(Alert.severity == "MEDIUM", Alert.is_resolved == False).count()
    low_alerts = db.query(Alert).filter(Alert.severity == "LOW", Alert.is_resolved == False).count()
    
    # 3. Action totals
    blocked_traffic = db.query(TrafficLog).filter(TrafficLog.action == "DENY").count()
    allowed_traffic = db.query(TrafficLog).filter(TrafficLog.action == "ALLOW").count()
    
    # 4. Compute Security Score (0 to 100)
    # Deduct points for active critical (10 pts), high (5 pts), and medium (2 pts) unresolved alerts
    deductions = (critical_alerts * 10) + (high_alerts * 5) + (medium_alerts * 2)
    security_score = max(0, min(100, 100 - deductions))
    
    # 5. Top Suspicious IPs
    suspicious_ips_query = db.query(
        TrafficLog.source_ip,
        func.count(TrafficLog.id).label("total_hits"),
        func.avg(TrafficLog.risk_score).label("avg_risk"),
        TrafficLog.country
    ).filter(TrafficLog.risk_score > 40)\
     .group_by(TrafficLog.source_ip)\
     .order_by(func.count(TrafficLog.id).desc())\
     .limit(5).all()
     
    top_suspicious_ips = []
    for row in suspicious_ips_query:
        avg_risk = float(row.avg_risk)
        if avg_risk >= 85:
            threat = "CRITICAL"
        elif avg_risk >= 60:
            threat = "HIGH"
        elif avg_risk >= 35:
            threat = "MEDIUM"
        else:
            threat = "LOW"
            
        top_suspicious_ips.append({
            "ip": row.source_ip,
            "count": row.total_hits,
            "risk_score": round(avg_risk, 1),
            "threat_level": threat,
            "country": row.country
        })
        
    # 6. Azure Synced events count
    azure_synced_events = db.query(TrafficLog).filter(TrafficLog.is_synced == True).count()

    return {
        "total_traffic": total_traffic,
        "total_threats": total_threats,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "high_alerts": high_alerts,
        "medium_alerts": medium_alerts,
        "low_alerts": low_alerts,
        "blocked_traffic": blocked_traffic,
        "allowed_traffic": allowed_traffic,
        "anomaly_count": anomaly_count,
        "security_score": security_score,
        "top_suspicious_ips": top_suspicious_ips,
        "azure_connected": bool(WORKSPACE_ID and PRIMARY_KEY),
        "azure_synced_events": azure_synced_events,
        "simulator_active": SIMULATOR_ACTIVE
    }

# ─── Analytics Helpers ──────────────────────────────────────────────
@router.get("/analytics/protocols", response_model=List[schemas.ProtocolStats])
def get_protocol_distribution(db: Session = Depends(get_db)):
    total = db.query(TrafficLog).count()
    if total == 0:
        return []
        
    proto_counts = db.query(
        TrafficLog.protocol,
        func.count(TrafficLog.id).label("count")
    ).group_by(TrafficLog.protocol).all()
    
    results = []
    for row in proto_counts:
        results.append({
            "protocol": row.protocol,
            "count": row.count,
            "percentage": round((row.count / total) * 100, 1)
        })
    return results

@router.get("/analytics/timeline", response_model=List[schemas.TimelinePoint])
def get_traffic_timeline(db: Session = Depends(get_db)):
    # Group logs by timestamp hour
    timeline_query = db.query(
        func.strftime("%Y-%m-%d %H:00:00", TrafficLog.timestamp).label("hour"),
        func.count(TrafficLog.id).label("total"),
        func.sum(case((TrafficLog.action == 'DENY', 1), else_=0)).label("denied"),
        func.sum(case((TrafficLog.action == 'ALLOW', 1), else_=0)).label("allowed")
    ).group_by("hour")\
     .order_by("hour")\
     .limit(24).all()
     
    timeline = []
    for row in timeline_query:
        timeline.append({
            "timestamp": row.hour,
            "count": row.total,
            "denied": row.denied or 0,
            "allowed": row.allowed or 0
        })
    return timeline


# ─── WebSocket Real-Time Security Stream ───────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# ─── Azure Log Analytics Cloud Ingestion Config ───────────────────
WORKSPACE_ID  = os.getenv("LOG_ANALYTICS_WORKSPACE_ID")
PRIMARY_KEY   = os.getenv("LOG_ANALYTICS_PRIMARY_KEY")
LOG_TYPE      = "NetShieldTrafficLogs"

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
        response = requests.post(uri, data=body, headers=headers, timeout=8)
        if response.status_code == 200:
            print(f"[OK] Asynchronously pushed dynamic event payload to Azure Cloud Workspace.")
            return True
        else:
            print(f"[ERROR] Azure cloud push failed: {response.status_code} — {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Azure connection error: {e}")
        return False

def sync_and_mark_log(log_id: int, azure_log: dict):
    """Syncs log to Azure and updates local SQLite status upon success"""
    success = push_to_log_analytics([azure_log])
    if success:
        db = SessionLocal()
        try:
            log_item = db.query(TrafficLog).filter(TrafficLog.id == log_id).first()
            if log_item:
                log_item.is_synced = True
                db.commit()
                print(f"[OK] Marked log ID {log_id} as synced to Azure.")
        except Exception as e:
            print(f"[WARN] Error updating is_synced for log {log_id}: {e}")
        finally:
            db.close()

# Telemetry simulation active state
SIMULATOR_ACTIVE = True

# Load ML Model & Scaler on Startup
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "ml_models", "isolation_forest.pkl")
SCALER_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "ml_models", "scaler.pkl")

ml_model = None
ml_scaler = None
if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    try:
        ml_model = joblib.load(MODEL_PATH)
        ml_scaler = joblib.load(SCALER_PATH)
        print("[OK] Live threat stream successfully loaded Isolation Forest model.")
    except Exception as e:
        print(f"[WARN] Error loading ML models for live stream: {e}")

# IP Pools for Live Simulation
NORMAL_IPS = ["192.168.1.10", "192.168.1.20", "10.0.1.5", "10.0.2.5", "172.16.0.10"]
SUSPICIOUS_IPS = ["103.45.67.89", "185.220.101.45", "45.33.32.156", "198.199.88.24", "167.99.120.44"]
KNOWN_MALICIOUS_IPS = ["194.165.16.72", "91.92.109.196", "185.224.128.43", "192.241.220.48"]
INTERNAL_IPS = ["10.0.1.4", "10.0.1.5", "10.0.2.4", "172.16.0.1"]
COUNTRIES = ["USA", "Russia", "India", "Germany", "Singapore", "Iran", "Ukraine"]

def generate_single_simulated_log(db: Session = None) -> dict:
    """Generates a realistic single network traffic log"""
    flow_type = random.choices(
        ["normal", "brute_force", "port_scan", "ddos"],
        weights=[0.80, 0.07, 0.07, 0.06],
        k=1
    )[0]

    src = random.choice(NORMAL_IPS)
    dest = random.choice(INTERNAL_IPS)
    protocol = random.choice(["TCP", "UDP", "ICMP"])
    dest_port = random.choice([80, 443, 8080])
    action = "ALLOW"
    bytes_sent = random.randint(150, 4500)
    packets = random.randint(2, 15)
    country = random.choice(["USA", "Germany", "Singapore"])

    if flow_type == "brute_force":
        base_ip = random.choice(SUSPICIOUS_IPS)
        parts = base_ip.split('.')
        src = f"{parts[0]}.{parts[1]}.{parts[2]}.{random.randint(2, 254)}"
        dest_port = 22
        action = "DENY"
        bytes_sent = random.randint(40, 200)
        packets = random.randint(1, 3)
        country = random.choice(["Russia", "Iran", "Ukraine"])
    elif flow_type == "port_scan":
        base_ip = random.choice(SUSPICIOUS_IPS)
        parts = base_ip.split('.')
        src = f"{parts[0]}.{parts[1]}.{parts[2]}.{random.randint(2, 254)}"
        dest_port = random.randint(20, 1024)
        action = "DENY"
        bytes_sent = random.randint(40, 100)
        packets = 1
        country = random.choice(["Russia", "China", "Germany"])
    elif flow_type == "ddos":
        base_ip = random.choice(KNOWN_MALICIOUS_IPS)
        parts = base_ip.split('.')
        src = f"{parts[0]}.{parts[1]}.{parts[2]}.{random.randint(2, 254)}"
        dest_port = random.choice([80, 443])
        action = random.choice(["ALLOW", "DENY"])
        bytes_sent = random.randint(15000, 65000)
        packets = random.randint(100, 600)
        country = random.choice(["Iran", "Russia", "Ukraine"])

    # Calculate risk score & anomalies
    is_anomaly = False
    risk_score = 0.0
    threat_level = "LOW"

    # Preprocessing features helper
    COMMON_PORTS = {80: 1, 443: 1, 22: 4, 21: 3, 23: 5, 3389: 4, 445: 5}
    
    if ml_model and ml_scaler:
        try:
            # Create features DataFrame
            port_danger = COMMON_PORTS.get(dest_port, 2)
            
            def encode_proto(p):
                p = str(p).upper()
                if "TCP" in p: return 1
                elif "UDP" in p: return 2
                elif "ICMP" in p: return 3
                return 4
            protocol_enc = encode_proto(protocol)
            action_enc = 1 if action == "DENY" else 0
            log_bytes = np.log1p(float(bytes_sent))
            log_packets = np.log1p(float(packets))
            byte_packet_ratio = np.log1p(float(bytes_sent) / (float(packets) + 1.0))

            features_df = pd.DataFrame([{
                'port_danger': port_danger,
                'protocol_enc': protocol_enc,
                'action_enc': action_enc,
                'log_bytes': log_bytes,
                'log_packets': log_packets,
                'byte_packet_ratio': byte_packet_ratio
            }])

            # Scale and Predict
            scaled_features = ml_scaler.transform(features_df)
            pred = ml_model.predict(scaled_features)[0]
            decision = ml_model.decision_function(scaled_features)[0]

            is_anomaly = pred == -1
            # Map decision to risk score 0-100
            norm = (decision - (-0.4)) / (0.2 - (-0.4))
            risk_score = round(max(0.0, min(1.0, 1.0 - norm)) * 100, 1)

            # Override for malicious types
            if flow_type in ["brute_force", "port_scan", "ddos"]:
                is_anomaly = True
                if risk_score < 60:
                    risk_score = round(random.uniform(70, 99.9), 1)
        except Exception:
            # Fallback on preprocessing error
            is_anomaly = flow_type != "normal"
            risk_score = round(random.uniform(70, 99), 1) if is_anomaly else round(random.uniform(5, 35), 1)
    else:
        # Fallback if ML models not loaded
        is_anomaly = flow_type != "normal"
        risk_score = round(random.uniform(70, 99), 1) if is_anomaly else round(random.uniform(5, 35), 1)

    if risk_score >= 85:
        threat_level = "CRITICAL"
    elif risk_score >= 60:
        threat_level = "HIGH"
    elif risk_score >= 35:
        threat_level = "MEDIUM"
    else:
        threat_level = "LOW"

    # Dynamic SOAR blocklist override (Self-Remediation)
    if db:
        try:
            rule_exists = db.query(FirewallRule).filter(FirewallRule.ip_address == src, FirewallRule.is_active == True).first()
            if rule_exists:
                action = "DENY"
                risk_score = 100.0
                threat_level = "CRITICAL"
                is_anomaly = True
        except Exception as e:
            print(f"[WARN] Error querying FirewallRules: {e}")

    return {
        "source_ip": src,
        "dest_ip": dest,
        "source_port": random.randint(1024, 65535),
        "dest_port": dest_port,
        "protocol": protocol,
        "action": action,
        "bytes_sent": bytes_sent,
        "packets": packets,
        "risk_score": risk_score,
        "threat_level": threat_level,
        "flow_type": flow_type,
        "country": country,
        "is_anomaly": is_anomaly
    }

async def live_traffic_stream_loop():
    """Generates logs and broadcasts updates to WebSocket clients continuously"""
    while True:
        if len(manager.active_connections) > 0 and SIMULATOR_ACTIVE:
            db = SessionLocal()
            try:
                # Generate new log
                log_data = generate_single_simulated_log(db)
                
                # Commit to DB
                new_log = TrafficLog(
                    source_ip=log_data["source_ip"],
                    dest_ip=log_data["dest_ip"],
                    source_port=log_data["source_port"],
                    dest_port=log_data["dest_port"],
                    protocol=log_data["protocol"],
                    action=log_data["action"],
                    bytes_sent=log_data["bytes_sent"],
                    packets=log_data["packets"],
                    risk_score=log_data["risk_score"],
                    threat_level=log_data["threat_level"],
                    flow_type=log_data["flow_type"],
                    country=log_data["country"],
                    timestamp=datetime.utcnow(),
                    is_anomaly=log_data["is_anomaly"]
                )
                db.add(new_log)
                db.commit()
                db.refresh(new_log)

                # Format log out matching schema
                log_out = {
                    "id": new_log.id,
                    "source_ip": new_log.source_ip,
                    "dest_ip": new_log.dest_ip,
                    "source_port": new_log.source_port,
                    "dest_port": new_log.dest_port,
                    "protocol": new_log.protocol,
                    "action": new_log.action,
                    "bytes_sent": new_log.bytes_sent,
                    "packets": new_log.packets,
                    "risk_score": new_log.risk_score,
                    "threat_level": new_log.threat_level,
                    "flow_type": new_log.flow_type,
                    "country": new_log.country,
                    "is_anomaly": new_log.is_anomaly,
                    "timestamp": new_log.timestamp.isoformat()
                }

                # Trigger alert if critical/high
                alert_out = None
                if log_data["is_anomaly"] or log_data["threat_level"] in ["HIGH", "CRITICAL"]:
                    # Log anomaly
                    new_anomaly = Anomaly(
                        log_id=new_log.id,
                        source_ip=new_log.source_ip,
                        anomaly_score=float(-0.1 if log_data["is_anomaly"] else 0.1),
                        risk_score=log_data["risk_score"],
                        model_used="IsolationForest (Scikit-Learn)",
                        features_json="{}",
                        timestamp=datetime.utcnow()
                    )
                    db.add(new_anomaly)

                    # Trigger alert
                    if log_data["threat_level"] in ["HIGH", "CRITICAL"]:
                        msg = f"NetShield ML Engine detected {log_data['flow_type'].upper()} behavior from IP {log_data['source_ip']} to Port {log_data['dest_port']} ({log_data['protocol']}). Risk Score: {log_data['risk_score']}."
                        new_alert = Alert(
                            source_ip=new_log.source_ip,
                            alert_type=new_log.flow_type if new_log.flow_type != "normal" else "anomaly",
                            severity=new_log.threat_level,
                            message=msg,
                            is_resolved=False,
                            timestamp=datetime.utcnow()
                        )
                        db.add(new_alert)
                        db.commit()
                        db.refresh(new_alert)

                        alert_out = {
                            "id": str(new_alert.id),
                            "severity": new_alert.severity,
                            "ip": new_alert.source_ip,
                            "type": new_alert.alert_type.replace('_', ' ').upper() if new_alert.alert_type else 'ALERT',
                            "time": new_alert.timestamp.strftime("%H:%M:%S"),
                            "port": new_log.dest_port,
                            "description": new_alert.message
                        }

                        # SOAR Dynamic Mitigation Trigger
                        if new_log.threat_level == "CRITICAL":
                            rule_exists = db.query(FirewallRule).filter(
                                FirewallRule.ip_address == new_log.source_ip,
                                FirewallRule.is_active == True
                            ).first()
                            
                            if not rule_exists:
                                new_rule = FirewallRule(
                                    ip_address=new_log.source_ip,
                                    reason=new_log.flow_type if new_log.flow_type != "normal" else "anomaly",
                                    blocked_at=datetime.utcnow(),
                                    is_active=True
                                )
                                db.add(new_rule)
                                db.commit()
                                
                                soar_event_out = {
                                    "event": "soar_playbook",
                                    "action": "BLOCK_IP",
                                    "ip": new_log.source_ip,
                                    "reason": new_log.flow_type.upper() if new_log.flow_type != "normal" else "ANOMALY",
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                                await manager.broadcast(json.dumps(soar_event_out))
                    else:
                        db.commit()

                # Asynchronously push to Azure Cloud Log Analytics (non-blocking thread)
                # Cost-Aware Selective Logging: Only sync CRITICAL/HIGH threats or anomalies to Azure!
                if WORKSPACE_ID and PRIMARY_KEY:
                    should_sync = log_out["threat_level"] in ["HIGH", "CRITICAL"] or log_out["is_anomaly"]
                    if should_sync:
                        azure_log = {
                            "source_ip": log_out["source_ip"],
                            "dest_ip": log_out["dest_ip"],
                            "source_port": log_out["source_port"],
                            "dest_port": log_out["dest_port"],
                            "protocol": log_out["protocol"],
                            "action": log_out["action"],
                            "bytes_sent": log_out["bytes_sent"],
                            "packets": log_out["packets"],
                            "risk_score": log_out["risk_score"],
                            "threat_level": log_out["threat_level"],
                            "flow_type": log_out["flow_type"],
                            "country": log_out["country"],
                            "timestamp": log_out["timestamp"],
                            "is_anomaly": log_out["is_anomaly"]
                        }
                        asyncio.create_task(asyncio.to_thread(sync_and_mark_log, new_log.id, azure_log))

                # Get latest Stats & Active alerts (re-fetched so UI stays fresh)
                stats = get_dashboard_statistics(db)

                # Broadcast payload
                payload = {
                    "event": "live_telemetry",
                    "new_log": log_out,
                    "alert": alert_out,
                    "stats": stats
                }
                await manager.broadcast(json.dumps(payload))
            except Exception as e:
                print(f"[WARN] Error in live traffic WS loop: {e}")
            finally:
                db.close()

        await asyncio.sleep(2.0)

# ─── Toggle Simulator Control ──────────────────────────────────────
@router.post("/simulator/toggle")
def toggle_simulator(active: bool):
    global SIMULATOR_ACTIVE
    SIMULATOR_ACTIVE = active
    print(f"[STATUS] Telemetry traffic generator set to active = {SIMULATOR_ACTIVE}")
    return {"simulator_active": SIMULATOR_ACTIVE}

# Start WebSocket background thread/task on app startup
@router.on_event("startup")
async def startup_event():
    asyncio.create_task(live_traffic_stream_loop())

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep socket alive and receive heartbeats if needed
            data = await websocket.receive_text()
            # Send keep-alive ping
            await websocket.send_text(json.dumps({"event": "ping"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

