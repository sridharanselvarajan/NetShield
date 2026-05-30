"""
NetShield AI — Pydantic Schemas
Request/Response models for API validation
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Traffic Log Schemas ──────────────────────────────────────────
class TrafficLogBase(BaseModel):
    source_ip:    str
    dest_ip:      str
    source_port:  int
    dest_port:    int
    protocol:     str
    action:       str
    bytes_sent:   int
    packets:      int
    flow_type:    str
    country:      Optional[str] = "Unknown"


class TrafficLogOut(TrafficLogBase):
    id:           int
    risk_score:   float
    threat_level: str
    is_anomaly:   bool
    timestamp:    datetime

    class Config:
        from_attributes = True


# ─── Alert Schemas ────────────────────────────────────────────────
class AlertBase(BaseModel):
    source_ip:  str
    alert_type: str
    severity:   str
    message:    str


class AlertOut(AlertBase):
    id:          int
    is_resolved: bool
    timestamp:   datetime

    class Config:
        from_attributes = True


# ─── Anomaly Schemas ──────────────────────────────────────────────
class AnomalyOut(BaseModel):
    id:            int
    log_id:        int
    source_ip:     str
    anomaly_score: float
    risk_score:    float
    model_used:    str
    timestamp:     datetime

    model_config = {
        "protected_namespaces": (),
        "from_attributes": True
    }


# ─── Dashboard Stats Schema ───────────────────────────────────────
class DashboardStats(BaseModel):
    total_traffic:      int
    total_threats:      int
    active_alerts:      int
    critical_alerts:    int
    high_alerts:        int
    medium_alerts:      int
    low_alerts:         int
    blocked_traffic:    int
    allowed_traffic:    int
    anomaly_count:      int
    security_score:     int   # 0-100
    top_suspicious_ips: List[dict]
    azure_connected:    bool
    azure_synced_events: int
    simulator_active:   bool


# ─── Analytics Schemas ────────────────────────────────────────────
class ProtocolStats(BaseModel):
    protocol: str
    count:    int
    percentage: float


class TimelinePoint(BaseModel):
    timestamp: str
    count:     int
    denied:    int
    allowed:   int


class TopIP(BaseModel):
    ip:          str
    count:       int
    risk_score:  float
    threat_level: str
    country:     str


# ─── Auth / User Schemas ──────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "analyst"  # 'admin' or 'analyst'


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str


class TokenData(BaseModel):
    username: Optional[str] = None

