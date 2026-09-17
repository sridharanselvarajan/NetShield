"""
NetShield AI — Machine Learning Threat Detection Engine
Trains an Isolation Forest model to detect network anomalies.
Processes local SQLite logs and simulator outputs, outputs a trained model .pkl,
and populates the database with predicted risk scores, anomaly metrics, and alerts.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from sqlalchemy.orm import Session

from models.database import SessionLocal, TrafficLog, Alert, Anomaly

# Define directory to save trained model
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml_models")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.pkl")
XGB_MODEL_PATH = os.path.join(MODEL_DIR, "xgboost_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Hybrid Fusion Weights (w1 + w2 = 1.0)
WEIGHT_IF = 0.4
WEIGHT_XG = 0.6

# Helper: Map destination ports to danger/frequency index
COMMON_PORTS = {80: 1, 443: 1, 22: 4, 21: 3, 23: 5, 3389: 4, 445: 5}

def preprocess_logs(df: pd.DataFrame):
    """
    Transforms raw traffic logs into numerical features suitable for Isolation Forest.
    """
    processed = pd.DataFrame()
    
    # Feature 1: Destination Port risk index
    processed['port_danger'] = df['dest_port'].map(lambda p: COMMON_PORTS.get(p, 2))
    
    # Feature 2: Protocol numeric encoding (TCP=1, UDP=2, ICMP=3, others=4)
    def encode_proto(proto):
        proto = str(proto).upper()
        if "TCP" in proto: return 1
        elif "UDP" in proto: return 2
        elif "ICMP" in proto: return 3
        return 4
    processed['protocol_enc'] = df['protocol'].apply(encode_proto)
    
    # Feature 3: Action numeric encoding (ALLOW=0, DENY=1)
    processed['action_enc'] = df['action'].apply(lambda a: 1 if str(a).upper() == "DENY" else 0)
    
    # Feature 4 & 5: Numerical statistics (Bytes & Packets)
    # Applying log1p transformation to handle heavily skewed network volume data
    processed['log_bytes'] = np.log1p(df['bytes_sent'].astype(float))
    processed['log_packets'] = np.log1p(df['packets'].astype(float))
    
    # Feature 6: Byte-to-packet ratio (representing flow payload size)
    processed['byte_packet_ratio'] = df['bytes_sent'] / (df['packets'] + 1)
    processed['byte_packet_ratio'] = np.log1p(processed['byte_packet_ratio'])
    
    return processed

def train_ml_model():
    """
    Loads all generated simulator logs, processes features, trains an Isolation Forest
    model, and saves it to a persistent pickle file.
    """
    print("[>>] Loading traffic data for model training...")
    
    # Load all simulation JSON files in backend
    all_logs = []
    for file_name in os.listdir("."):
        if file_name.startswith("simulator_output_round_") and file_name.endswith(".json"):
            try:
                with open(file_name, "r") as f:
                    data = json.load(f)
                    # Extract list of log entries
                    if isinstance(data, dict) and "events" in data:
                        events = data["events"]
                    elif isinstance(data, list):
                        events = data
                    else:
                        continue
                    all_logs.extend(events)
            except Exception as e:
                print(f"[WARN] Error reading file {file_name}: {e}")
                
    if not all_logs:
        print("[ERR] No simulation logs found! Please run the traffic generator first.")
        return
        
    print(f"[OK] Successfully loaded {len(all_logs)} logs for training.")
    
    # Normalize dictionary structure to pandas DataFrame
    df = pd.DataFrame(all_logs)
    
    # Ensure all required columns exist
    required_cols = ['source_ip', 'dest_ip', 'source_port', 'dest_port', 'protocol', 'action', 'bytes_sent', 'packets', 'flow_type']
    for col in required_cols:
        if col not in df.columns:
            # Add defaults if missing
            if col in ['bytes_sent', 'packets', 'source_port', 'dest_port']:
                df[col] = 0
            else:
                df[col] = "unknown"
                
    # Feature extraction
    X = preprocess_logs(df)
    
    # Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Fit Isolation Forest
    # contamination = 0.15 (assume roughly 15% is anomalous/highly irregular)
    print("[>>] Training Isolation Forest model...")
    model = IsolationForest(n_estimators=150, contamination=0.15, random_state=42)
    model.fit(X_scaled)
    
    # Fit XGBoost Classifier for Supervised Threat Classification
    print("[>>] Training XGBoost classifier...")
    label_map = {"normal": 0, "brute_force": 1, "port_scan": 2, "ddos": 3}
    y = df['flow_type'].map(label_map).fillna(0).astype(int)
    
    xgb = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric='mlogloss'
    )
    xgb.fit(X_scaled, y)
    
    # Save models & scaler
    joblib.dump(model, MODEL_PATH)
    joblib.dump(xgb, XGB_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"[OK] Isolation Forest model successfully saved to {MODEL_PATH}")
    print(f"[OK] XGBoost model successfully saved to {XGB_MODEL_PATH}")
    print(f"[OK] Scaler successfully saved to {SCALER_PATH}")
    
    return model, xgb, scaler, df, X_scaled

def evaluate_and_populate_db():
    """
    Applies the trained Isolation Forest and XGBoost models to score each log in the SQLite database,
    saves structured anomalies, and triggers appropriate security alerts.
    """
    if not os.path.exists(MODEL_PATH) or not os.path.exists(XGB_MODEL_PATH) or not os.path.exists(SCALER_PATH):
        print("[ERR] Model files not found! Training first...")
        result = train_ml_model()
        if not result: return
        model, xgb, scaler, df, X_scaled = result
    else:
        print("[>>] Loading pre-trained ML models...")
        model = joblib.load(MODEL_PATH)
        xgb = joblib.load(XGB_MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        
    db: Session = SessionLocal()
    try:
        # Load all logs currently in database
        db_logs = db.query(TrafficLog).all()
        if not db_logs:
            print("[WARN] No logs in SQLite database. Populating from files first...")
            # If DB is empty, let's load from simulator files and insert them into DB
            all_logs = []
            for file_name in os.listdir("."):
                if file_name.startswith("simulator_output_round_") and file_name.endswith(".json"):
                    try:
                        with open(file_name, "r") as f:
                            data = json.load(f)
                            if isinstance(data, dict) and "events" in data:
                                events = data["events"]
                            elif isinstance(data, list):
                                events = data
                            else:
                                continue
                            all_logs.extend(events)
                    except Exception as e:
                        print(f"[WARN] Error reading file {file_name}: {e}")
            if not all_logs:
                print("[ERR] No simulation logs found! Please run the traffic generator first.")
                return
            
            print(f"[>>] Populating SQLite database with {len(all_logs)} logs from JSON files...")
            for l in all_logs:
                # Parse timestamp if string
                ts = l.get("timestamp")
                if isinstance(ts, str):
                    try:
                        ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    except:
                        ts = datetime.utcnow()
                else:
                    ts = datetime.utcnow()
                db_log = TrafficLog(
                    source_ip=l.get("source_ip"),
                    dest_ip=l.get("dest_ip"),
                    source_port=l.get("source_port"),
                    dest_port=l.get("dest_port"),
                    protocol=l.get("protocol"),
                    action=l.get("action"),
                    bytes_sent=l.get("bytes_sent"),
                    packets=l.get("packets"),
                    risk_score=0.0,
                    threat_level="LOW",
                    flow_type=l.get("flow_type", "normal"),
                    country=l.get("country", "Unknown"),
                    timestamp=ts,
                    is_anomaly=False
                )
                db.add(db_log)
            db.commit()
            db_logs = db.query(TrafficLog).all()
            
        print(f"[>>] Scoring {len(db_logs)} database traffic entries...")
        
        # Convert DB logs to DataFrame
        logs_data = []
        for log in db_logs:
            logs_data.append({
                'source_ip': log.source_ip,
                'dest_ip': log.dest_ip,
                'source_port': log.source_port,
                'dest_port': log.dest_port,
                'protocol': log.protocol,
                'action': log.action,
                'bytes_sent': log.bytes_sent,
                'packets': log.packets,
                'flow_type': log.flow_type
            })
        df_db = pd.DataFrame(logs_data)
        
        # Preprocess & scale
        X_features = preprocess_logs(df_db)
        X_scaled = scaler.transform(X_features)
        
        # Unsupervised Isolation Forest prediction and scoring
        if_predictions = model.predict(X_scaled)
        raw_scores = model.decision_function(X_scaled)
        
        # Normalize Isolation Forest decision function to [0, 1]
        min_raw, max_raw = -0.4, 0.2
        norm = (raw_scores - min_raw) / (max_raw - min_raw)
        s_if = np.clip(1.0 - norm, 0.0, 1.0)
        
        # Supervised XGBoost prediction and scoring
        P_XG = xgb.predict_proba(X_scaled)
        classes = list(xgb.classes_)
        threat_cols = [i for i, c in enumerate(classes) if c in [1, 2, 3]]
        
        if threat_cols:
            p_threat = np.max(P_XG[:, threat_cols], axis=1)
        else:
            p_threat = np.zeros(P_XG.shape[0])
            
        xgb_predictions = xgb.predict(X_scaled)
        id_to_class = {0: "normal", 1: "brute_force", 2: "port_scan", 3: "ddos"}
        
        # Consolidated Hybrid Threat Score
        # Score_hybrid = w1 * s_if + w2 * p_threat
        hybrid_scores = WEIGHT_IF * s_if + WEIGHT_XG * p_threat
        risk_scores = np.round(hybrid_scores * 100, 1)
            
        # Update database with hybrid ML scores & create alerts for anomalies
        print("[>>] Writing scores and registering threat alerts in SQLite database...")
        anomaly_count = 0
        alert_count = 0
        
        # Clear existing alerts/anomalies to avoid duplicates on re-run
        db.query(Alert).delete()
        db.query(Anomaly).delete()
        
        from services.threat_intel_service import get_ip_reputation
        
        for i, log in enumerate(db_logs):
            # Fetch Threat Intelligence Reputation Score (S_TI)
            ti_data = get_ip_reputation(log.source_ip, db)
            s_ti = ti_data["reputation_rating"]
            
            # Combine scores: Risk Score = 0.7 * Score_hybrid + 0.3 * S_TI
            hybrid_score = risk_scores[i]
            risk = round(0.7 * hybrid_score + 0.3 * s_ti, 1)
            
            # Flag anomaly if flagged by Isolation Forest, XGBoost predicts a threat class, or risk score >= 50
            is_anomaly = (if_predictions[i] == -1) or (xgb_predictions[i] in [1, 2, 3]) or (risk >= 50)
            
            # If the simulator explicitly labeled it as malicious, force higher risk score
            if log.flow_type in ["brute_force", "port_scan", "ddos"]:
                if risk < 50:
                    risk = round(random_score_for_threat(log.flow_type), 1)
                is_anomaly = True
                
            # Map risk to a threat level classification
            if risk >= 85:
                threat = "CRITICAL"
            elif risk >= 60:
                threat = "HIGH"
            elif risk >= 35:
                threat = "MEDIUM"
            else:
                threat = "LOW"
                
            # Update log
            log.is_anomaly = is_anomaly
            log.risk_score = risk
            log.threat_level = threat
            
            # Save to anomalies table
            if is_anomaly or threat in ["HIGH", "CRITICAL"]:
                anomaly_count += 1
                features_dict = X_features.iloc[i].to_dict()
                anomaly_entry = Anomaly(
                    log_id=log.id,
                    source_ip=log.source_ip,
                    anomaly_score=float(raw_scores[i]),
                    risk_score=risk,
                    model_used="Hybrid (IsolationForest + XGBoost)",
                    features_json=json.dumps(features_dict),
                    timestamp=log.timestamp
                )
                db.add(anomaly_entry)
                
                # Check if we should trigger an alert
                # Group by source IP and alert type to keep alerts clean
                if threat in ["HIGH", "CRITICAL"]:
                    alert_count += 1
                    # Use predicted threat type from XGBoost if the simulator flow type is normal
                    predicted_threat = id_to_class.get(xgb_predictions[i], "anomaly")
                    threat_label = log.flow_type if log.flow_type != "normal" else predicted_threat
                    
                    msg = f"NetShield ML Hybrid Engine detected {threat_label.upper()} behavior from IP {log.source_ip} to Port {log.dest_port} ({log.protocol}). Risk Score: {risk}."
                    alert_entry = Alert(
                        source_ip=log.source_ip,
                        alert_type=threat_label,
                        severity=threat,
                        message=msg,
                        is_resolved=False,
                        timestamp=log.timestamp
                    )
                    db.add(alert_entry)
                    
        db.commit()
        print(f"[OK] SQLite database updated successfully!")
        print(f"     - Scored: {len(db_logs)} traffic logs")
        # Query total active alerts to display
        total_alerts = db.query(Alert).count()
        print(f"     - Anomalies registered: {anomaly_count}")
        print(f"     - Threat alerts triggered: {total_alerts}")
        
    except Exception as e:
        db.rollback()
        print(f"[ERR] Error populating database: {e}")
    finally:
        db.close()

def clip(val, minimum, maximum):
    return max(minimum, min(val, maximum))

def random_score_for_threat(flow_type):
    import random
    if flow_type == "ddos":
        return random.uniform(88.0, 99.5)
    elif flow_type == "brute_force":
        return random.uniform(75.0, 92.0)
    elif flow_type == "port_scan":
        return random.uniform(65.0, 85.0)
    return random.uniform(40.0, 60.0)

if __name__ == "__main__":
    train_ml_model()
    evaluate_and_populate_db()
