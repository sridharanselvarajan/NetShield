"""
NetShield AI — SQLite Database Models
Defines all tables using SQLAlchemy ORM
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./netshield.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── Traffic Logs Table ───────────────────────────────────────────
class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id            = Column(Integer, primary_key=True, index=True)
    source_ip     = Column(String, index=True)
    dest_ip       = Column(String)
    source_port   = Column(Integer)
    dest_port     = Column(Integer)
    protocol      = Column(String)           # TCP / UDP / ICMP
    action        = Column(String)           # ALLOW / DENY
    bytes_sent    = Column(Integer)
    packets       = Column(Integer)
    risk_score    = Column(Float, default=0.0)   # 0 to 100
    threat_level  = Column(String, default="LOW")  # LOW/MEDIUM/HIGH/CRITICAL
    flow_type     = Column(String, default="normal")  # normal/brute_force/port_scan/ddos
    country       = Column(String, default="Unknown")
    timestamp     = Column(DateTime, default=datetime.utcnow)
    is_anomaly    = Column(Boolean, default=False)
    is_synced     = Column(Boolean, default=False)


# ─── Alerts Table ─────────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id            = Column(Integer, primary_key=True, index=True)
    source_ip     = Column(String, index=True)
    alert_type    = Column(String)           # brute_force / port_scan / ddos / anomaly
    severity      = Column(String)           # LOW / MEDIUM / HIGH / CRITICAL
    message       = Column(Text)
    is_resolved   = Column(Boolean, default=False)
    timestamp     = Column(DateTime, default=datetime.utcnow)


# ─── Anomalies Table ──────────────────────────────────────────────
class Anomaly(Base):
    __tablename__ = "anomalies"

    id             = Column(Integer, primary_key=True, index=True)
    log_id         = Column(Integer, index=True)
    source_ip      = Column(String)
    anomaly_score  = Column(Float)       # Isolation Forest score
    risk_score     = Column(Float)       # 0 to 100
    model_used     = Column(String, default="IsolationForest")
    features_json  = Column(Text)        # JSON string of features used
    timestamp      = Column(DateTime, default=datetime.utcnow)


# ─── Users Table ──────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, default="analyst")  # admin or analyst


# ─── Firewall Rules Table (SOAR) ──────────────────────────────────
class FirewallRule(Base):
    __tablename__ = "firewall_rules"

    id         = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True, nullable=False)
    reason     = Column(String)  # 'ddos', 'brute_force', etc.
    blocked_at = Column(DateTime, default=datetime.utcnow)
    is_active  = Column(Boolean, default=True)


# ─── Create All Tables ────────────────────────────────────────────
def create_tables():
    Base.metadata.create_all(bind=engine)
    # Check if is_synced exists, otherwise alter table
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE traffic_logs ADD COLUMN is_synced BOOLEAN DEFAULT 0"))
            conn.commit()
            print("[MIGRATION] Added is_synced column to traffic_logs table")
    except Exception:
        pass
    print("[OK] Database tables created successfully")


# ─── DB Session Dependency ────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    create_tables()
