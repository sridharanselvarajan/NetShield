"""
NetShield AI — Main FastAPI Application
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models.database import create_tables
from routers import security, auth

load_dotenv()

# Initialize Database
create_tables()

app = FastAPI(
    title="NetShield AI",
    description="AI-Powered Threat Detection and Security Operations Center Dashboard",
    version="1.0.0"
)

# Enable CORS for the frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth & Security Routers
app.include_router(auth.router)
app.include_router(security.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "NetShield AI Backend Core API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    # Read environment host & port
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
