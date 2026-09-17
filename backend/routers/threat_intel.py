"""
NetShield AI — Threat Intelligence Routers
Exposes endpoints for querying reputation status, manual lookup, and local cache.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from models.database import get_db, ThreatIntelCache
from services import threat_intel_service

router = APIRouter(prefix="/api/threat-intel", tags=["Threat Intelligence"])

@router.get("/status")
def get_api_status():
    """Returns whether actual API keys are configured and mode of operation"""
    return threat_intel_service.get_keys_status()

@router.get("/lookup")
def lookup_ip_reputation(
    ip: str = Query(..., description="IPv4 Address to check reputation for"),
    db: Session = Depends(get_db)
):
    """
    Looks up reputation for a specific IP. Checks the database cache first,
    falling back to external API clients or simulated metrics.
    """
    if not ip or len(ip.split(".")) != 4:
        raise HTTPException(status_code=400, detail="Invalid IPv4 address format.")
    try:
        result = threat_intel_service.get_ip_reputation(ip, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Threat intelligence lookup failed: {str(e)}")

@router.get("/cache")
def get_cached_reputations(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Retrieves all threat intelligence cache table records"""
    records = db.query(ThreatIntelCache)\
                .order_by(ThreatIntelCache.cached_at.desc())\
                .offset(offset)\
                .limit(limit)\
                .all()
    
    return [
        {
            "ip_address": r.ip_address,
            "abuse_score": r.abuse_score,
            "vt_score": r.vt_score,
            "otx_score": r.otx_score,
            "reputation_rating": r.reputation_rating,
            "cached_at": r.cached_at.isoformat()
        }
        for r in records
    ]

@router.delete("/cache/purge")
def purge_reputation_cache(db: Session = Depends(get_db)):
    """Deletes all entries in the threat intelligence cache database table"""
    try:
        deleted_count = db.query(ThreatIntelCache).delete()
        db.commit()
        print(f"[CLEANUP] Purged {deleted_count} reputation records from ThreatIntel cache table.")
        return {"message": "Threat intelligence cache successfully purged", "purged_count": deleted_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to purge cache: {str(e)}")
