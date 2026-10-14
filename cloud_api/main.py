import os
import sqlite3
import time
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="CloudAnchor Simulated Cloud API with Multi-Sensor Analytics")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cloud State Simulation
CLOUD_STATE = {
    "status": "ONLINE"  # ONLINE, OFFLINE
}

DB_PATH = os.path.join(os.path.dirname(__file__), "cloud.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create table with multi-sensor schema
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cloud_data (
            request_id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            
            -- Raw Primary Sensors (DHT22)
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            
            -- Raw Primary Sensors (MPU6050)
            acceleration_x REAL DEFAULT 0.0,
            acceleration_y REAL DEFAULT 0.0,
            acceleration_z REAL DEFAULT 1.0,
            vibration_level REAL DEFAULT 0.0,
            
            -- Raw Primary Sensors (INA219)
            voltage REAL DEFAULT 5.0,
            current REAL DEFAULT 0.0,
            power REAL DEFAULT 0.0,
            
            -- Raw Secondary Sensors (MQ-2, BMP280)
            gas_level REAL,
            pressure REAL,
            
            -- Derived Multi-Sensor Fusion Intelligence
            health_score INTEGER DEFAULT 100,
            system_status TEXT DEFAULT 'NORMAL',
            risk_level TEXT DEFAULT 'LOW',
            warning_reason TEXT,
            
            received_at TEXT NOT NULL
        )
    """)

    # 2. Schema Migration: add missing columns if upgrading existing cloud.db
    cursor.execute("PRAGMA table_info(cloud_data)")
    existing_cols = {col[1] for col in cursor.fetchall()}
    
    new_columns = [
        ("session_id", "TEXT DEFAULT 'SIM-DEFAULT'"),
        ("acceleration_x", "REAL DEFAULT 0.0"),
        ("acceleration_y", "REAL DEFAULT 0.0"),
        ("acceleration_z", "REAL DEFAULT 1.0"),
        ("vibration_level", "REAL DEFAULT 0.0"),
        ("voltage", "REAL DEFAULT 5.0"),
        ("current", "REAL DEFAULT 0.0"),
        ("power", "REAL DEFAULT 0.0"),
        ("gas_level", "REAL"),
        ("pressure", "REAL"),
        ("health_score", "INTEGER DEFAULT 100"),
        ("system_status", "TEXT DEFAULT 'NORMAL'"),
        ("risk_level", "TEXT DEFAULT 'LOW'"),
        ("warning_reason", "TEXT"),
    ]
    
    for col_name, col_def in new_columns:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE cloud_data ADD COLUMN {col_name} {col_def}")

    conn.commit()
    conn.close()

init_db()

class SensorData(BaseModel):
    request_id: str
    device_id: str
    timestamp: str
    session_id: Optional[str] = "SIM-DEFAULT"
    
    # Raw Sensors
    temperature: float
    humidity: float
    acceleration_x: Optional[float] = 0.0
    acceleration_y: Optional[float] = 0.0
    acceleration_z: Optional[float] = 1.0
    vibration_level: Optional[float] = 0.0
    voltage: Optional[float] = 5.0
    current: Optional[float] = 0.0
    power: Optional[float] = 0.0
    gas_level: Optional[float] = None
    pressure: Optional[float] = None
    
    # Derived Multi-Sensor Fusion
    health_score: Optional[int] = 100
    system_status: Optional[str] = "NORMAL"
    risk_level: Optional[str] = "LOW"
    warning_reason: Optional[str] = None

class ControlState(BaseModel):
    status: str  # ONLINE, OFFLINE

# Middleware to simulate outages
@app.middleware("http")
async def check_cloud_status(request: Request, call_next):
    if request.url.path.startswith("/control") or request.url.path in ["/", "/docs", "/redoc", "/openapi.json", "/health"]:
        return await call_next(request)

    if CLOUD_STATE["status"] == "OFFLINE":
        return Response(
            content="Cloud API Offline",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    return await call_next(request)

@app.get("/")
def root_info():
    """Root endpoint providing Cloud API overview, current simulation state, and endpoints."""
    return {
        "service": "CloudAnchor Simulated Cloud API",
        "version": "2.0.0",
        "status": CLOUD_STATE["status"],
        "description": "Target Cloud API receiving and storing synchronized multi-sensor telemetry from Fog Gateway",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "health": "/health",
            "stored_cloud_data": "/data (GET)",
            "ingest_from_gateway": "/data (POST)",
            "outage_simulation_control": "/control (GET / POST)"
        },
        "frontend_dashboard": "http://localhost:5173",
        "fog_gateway_api": "http://127.0.0.1:8000"
    }

@app.get("/health")
async def health():
    return {"status": CLOUD_STATE["status"], "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}

@app.post("/data", status_code=status.HTTP_201_CREATED)
async def receive_data(data: SensorData):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        received_at = time.strftime("%Y-%m-%d %H:%M:%S")
        sess_id = data.session_id or "SIM-DEFAULT"
        cursor.execute("""
            INSERT INTO cloud_data (
                request_id, session_id, device_id, timestamp,
                temperature, humidity,
                acceleration_x, acceleration_y, acceleration_z, vibration_level,
                voltage, current, power,
                gas_level, pressure,
                health_score, system_status, risk_level, warning_reason,
                received_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.request_id, sess_id, data.device_id, data.timestamp,
            data.temperature, data.humidity,
            data.acceleration_x, data.acceleration_y, data.acceleration_z, data.vibration_level,
            data.voltage, data.current, data.power,
            data.gas_level, data.pressure,
            data.health_score, data.system_status, data.risk_level, data.warning_reason,
            received_at
        ))
        conn.commit()
    except sqlite3.IntegrityError:
        # If request already exists in cloud_data, update the row (idempotent)
        try:
            cursor.execute("""
                UPDATE cloud_data
                SET session_id = ?, device_id = ?, timestamp = ?,
                    temperature = ?, humidity = ?,
                    acceleration_x = ?, acceleration_y = ?, acceleration_z = ?, vibration_level = ?,
                    voltage = ?, current = ?, power = ?,
                    gas_level = ?, pressure = ?,
                    health_score = ?, system_status = ?, risk_level = ?, warning_reason = ?,
                    received_at = ?
                WHERE request_id = ?
            """, (
                data.session_id or "SIM-DEFAULT", data.device_id, data.timestamp,
                data.temperature, data.humidity,
                data.acceleration_x, data.acceleration_y, data.acceleration_z, data.vibration_level,
                data.voltage, data.current, data.power,
                data.gas_level, data.pressure,
                data.health_score, data.system_status, data.risk_level, data.warning_reason,
                time.strftime("%Y-%m-%d %H:%M:%S"),
                data.request_id
            ))
            conn.commit()
        except sqlite3.Error as e:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}"
            )
    except sqlite3.Error as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    
    conn.close()
    return {
        "status": "success",
        "message": "Multi-sensor data ingested to cloud",
        "request_id": data.request_id,
        "health_score": data.health_score,
        "system_status": data.system_status
    }

@app.get("/data")
async def get_all_data(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cloud_data ORDER BY received_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/control")
async def get_control_state():
    return CLOUD_STATE

@app.post("/control")
async def set_control_state(state: ControlState):
    if state.status not in ["ONLINE", "OFFLINE"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be ONLINE or OFFLINE")
    
    CLOUD_STATE["status"] = state.status
    return {"message": "Cloud state updated", "current_state": CLOUD_STATE}
