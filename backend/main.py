import asyncio
import threading
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import requests

from backend.database import (
    init_db,
    get_record_by_request_id,
    insert_record,
    update_status,
    get_pending_records,
    get_queue_counts,
    get_recent_records,
    archive_legacy_pending_records,
    clear_failed_records
)
from backend.circuit_breaker import CircuitBreaker
from backend.telemetry_cache import telemetry_cache
from backend.multi_sensor_fusion import MultiSensorFusionEngine

app = FastAPI(title="CloudAnchor Fog Gateway with Multi-Sensor Fusion & Resilient Queue")
circuit_breaker = CircuitBreaker()

def clean_float(val: Any, default: float = 0.0) -> float:
    """Safely extracts a clean float even from messy or formatted strings."""
    if val is None:
        return default
    try:
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            try:
                return float(val)
            except ValueError:
                cleaned = "".join(c for c in val if c.isdigit() or c in ".-")
                return float(cleaned) if cleaned else default
        return default
    except Exception:
        return default

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Circuit Breaker & Exponential Backoff Settings
BASE_BACKOFF = 2   # seconds
MAX_BACKOFF = 32   # seconds

def backoff_delay(retry_count: int) -> int:
    """Calculate exponential backoff delay for given retry count."""
    return min(BASE_BACKOFF * (2 ** retry_count), MAX_BACKOFF)

# In-Memory Metrics & Logs
GATEWAY_METRICS = {
    "total_requests": 0,
    "success_requests": 0,
    "failed_requests": 0,
}

GATEWAY_LOGS: List[Dict[str, Any]] = []
LOG_ID_COUNTER = 0

def add_log(level: str, message: str):
    global LOG_ID_COUNTER
    LOG_ID_COUNTER += 1
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "id": LOG_ID_COUNTER,
        "timestamp": timestamp,
        "level": level.upper(),
        "message": message
    }
    GATEWAY_LOGS.append(log_entry)
    print(f"[{timestamp}] [{level.upper()}] {message}")
    
    # Keep list bounded to 150 entries
    if len(GATEWAY_LOGS) > 150:
        GATEWAY_LOGS.pop(0)

# Settings Configuration
GATEWAY_SETTINGS = {
    "cloud_url": "http://localhost:8001"
}

# Active Session Tracking (Allows Arduino simulation to restart at REQ-1 without database collision)
ACTIVE_SESSION_ID: Optional[str] = None
LAST_INGESTED_REQ_ID: Optional[str] = None

# --- Multi-Sensor Data Models ---
class SensorPayload(BaseModel):
    request_id: str = Field(..., min_length=1, description="Authoritative Request Number from Arduino (e.g. REQ-1)")
    device_id: Optional[str] = Field(default="ARDUINO-001", description="Originating IoT Edge Device ID")
    session_id: Optional[str] = Field(default=None, description="Optional Simulation Session Identifier")
    timestamp: Optional[str] = Field(default=None, description="ISO or standard timestamp string")
    
    # Primary Tinkercad Sensor Values
    temperature: float = Field(..., ge=-50.0, le=120.0, description="Temperature in °C")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative Humidity in %")
    voltage: Optional[float] = Field(default=5.0, ge=0.0, le=60.0, description="Bus Voltage in V")
    
    # Derived Values
    current: Optional[float] = Field(default=0.0, ge=0.0, le=10000.0, description="Load Current in mA")
    power: Optional[float] = Field(default=0.0, ge=0.0, le=500.0, description="Power Consumption in W")
    
    # System Values
    health_score: Optional[int] = Field(default=None, ge=0, le=100, description="Health Score 0-100")
    system_status: Optional[str] = Field(default=None, description="System status: NORMAL, WARNING, CRITICAL")
    risk_level: Optional[str] = Field(default=None, description="Risk level: LOW, MEDIUM, HIGH")
    warning_reason: Optional[str] = Field(default=None, description="Warning explanation")
    
    # Optional legacy fields
    acceleration_x: Optional[float] = Field(default=0.0, ge=-20.0, le=20.0, description="X acceleration in g")
    acceleration_y: Optional[float] = Field(default=0.0, ge=-20.0, le=20.0, description="Y acceleration in g")
    acceleration_z: Optional[float] = Field(default=1.0, ge=-20.0, le=20.0, description="Z acceleration in g")
    vibration_level: Optional[float] = Field(default=0.0, ge=0.0, le=50.0, description="Calculated vibration magnitude index")
    gas_level: Optional[float] = Field(default=None, ge=0.0, le=10000.0, description="Gas / Smoke concentration in ppm")
    pressure: Optional[float] = Field(default=None, ge=300.0, le=1300.0, description="Atmospheric Pressure in hPa")

class CloudStatePayload(BaseModel):
    status: str  # ONLINE, OFFLINE

class ResilienceConfigPayload(BaseModel):
    failure_threshold: Optional[int] = None
    cooldown_duration: Optional[float] = None
    max_backoff: Optional[int] = None

# --- Background Synchronization Worker ---
def sync_worker_thread():
    """Periodically queries gateway.db for PENDING records in the active session and attempts FIFO cloud sync with exponential backoff."""
    while True:
        try:
            time.sleep(1.0)
            if ACTIVE_SESSION_ID is None:
                continue

            pending_records = get_pending_records(limit=20, session_id=ACTIVE_SESSION_ID)
            if not pending_records:
                continue

            # Check if Circuit Breaker allows outbound requests
            can_attempt, cb_state = circuit_breaker.can_attempt_request()
            if not can_attempt:
                continue

            cloud_url = f"{GATEWAY_SETTINGS['cloud_url']}/data"
            headers = {"Content-Type": "application/json"}

            now = time.time()
            for record in pending_records:
                rec_id = record["id"]
                req_id = str(record["request_id"])
                sess_id = str(record.get("session_id") or ACTIVE_SESSION_ID)
                retry_count = record.get("retry_count", 0) or 0
                delay = backoff_delay(retry_count)

                # Determine last update timestamp
                try:
                    last_update = time.strptime(record["updated_at"], "%Y-%m-%d %H:%M:%S")
                    last_update_ts = time.mktime(last_update)
                except Exception:
                    last_update_ts = now

                if now - last_update_ts < delay:
                    # Not yet time to retry this record according to exponential backoff
                    continue

                temp = clean_float(record.get("temperature"), 25.0)
                hum = clean_float(record.get("humidity"), 50.0)
                volt = clean_float(record.get("voltage"), 5.0)
                curr = clean_float(record.get("current"), 0.0)
                pwr = clean_float(record.get("power"), 0.0)
                h_score = int(clean_float(record.get("health_score"), 100))

                payload = {
                    "request_id": req_id,
                    "session_id": sess_id,
                    "device_id": str(record.get("device_id") or "ARDUINO-001"),
                    "timestamp": str(record.get("timestamp") or time.strftime("%Y-%m-%d %H:%M:%S")),
                    "temperature": temp,
                    "humidity": hum,
                    "acceleration_x": clean_float(record.get("acceleration_x"), 0.0),
                    "acceleration_y": clean_float(record.get("acceleration_y"), 0.0),
                    "acceleration_z": clean_float(record.get("acceleration_z"), 1.0),
                    "vibration_level": clean_float(record.get("vibration_level"), 0.0),
                    "voltage": volt,
                    "current": curr,
                    "power": pwr,
                    "gas_level": clean_float(record.get("gas_level"), None) if record.get("gas_level") is not None else None,
                    "pressure": clean_float(record.get("pressure"), None) if record.get("pressure") is not None else None,
                    "health_score": h_score,
                    "system_status": str(record.get("system_status") or "NORMAL"),
                    "risk_level": str(record.get("risk_level") or "LOW"),
                    "warning_reason": str(record.get("warning_reason")) if record.get("warning_reason") else None
                }

                try:
                    res = requests.post(cloud_url, json=payload, headers=headers, timeout=2.0)
                    if res.status_code in [200, 201]:
                        update_status(req_id, "SYNCED", record_id=rec_id)
                        GATEWAY_METRICS["success_requests"] += 1
                        _, transition_msg = circuit_breaker.record_success()
                        add_log("SUCCESS", f"[QUEUE SYNCED] {req_id} synchronized to Cloud API")
                        if transition_msg:
                            add_log("INFO", transition_msg)
                    elif res.status_code == 400 and "already exists" in res.text:
                        # Idempotency acknowledgment
                        update_status(req_id, "SYNCED", record_id=rec_id)
                        GATEWAY_METRICS["success_requests"] += 1
                        _, transition_msg = circuit_breaker.record_success()
                        add_log("SUCCESS", f"[QUEUE SYNCED] {req_id} synchronized to Cloud API")
                        if transition_msg:
                            add_log("INFO", transition_msg)
                    elif res.status_code == 422:
                        err_msg = f"Cloud HTTP 422: {res.text}"
                        update_status(req_id, "FAILED", last_error=err_msg, record_id=rec_id)
                        GATEWAY_METRICS["failed_requests"] += 1
                        circuit_breaker.reset_probing()
                        add_log("ERROR", f"[CLOUD VALIDATION ERROR] HTTP 422 for {req_id}: Cloud rejected schema. Marked FAILED. Detail: {res.text}")
                    elif res.status_code >= 500 or res.status_code in [502, 503, 504]:
                        err_msg = f"Cloud HTTP {res.status_code}"
                        update_status(req_id, "PENDING", last_error=err_msg, increment_retry=True, record_id=rec_id)
                        GATEWAY_METRICS["failed_requests"] += 1
                        _, transition_msg = circuit_breaker.record_failure(err_msg)
                        add_log("WARNING", f"[QUEUE SYNC FAILED] Cloud unavailable ({err_msg}). Retaining {req_id} in SQLite queue.")
                        if transition_msg:
                            add_log("WARNING", transition_msg)
                        break
                    else:
                        err_msg = f"Cloud HTTP {res.status_code}: {res.text}"
                        update_status(req_id, "FAILED", last_error=err_msg, record_id=rec_id)
                        GATEWAY_METRICS["failed_requests"] += 1
                        circuit_breaker.reset_probing()
                        add_log("WARNING", f"[QUEUE SYNC FAILED] Queued {req_id} rejected ({err_msg}). Marked FAILED.")
                except requests.exceptions.RequestException as e:
                    err_msg = str(e)
                    update_status(req_id, "PENDING", last_error=err_msg, increment_retry=True, record_id=rec_id)
                    _, transition_msg = circuit_breaker.record_failure(err_msg)
                    add_log("WARNING", f"[QUEUE SYNC FAILED] Cloud unreachable. Retaining {req_id} in SQLite queue.")
                    if transition_msg:
                        add_log("WARNING", transition_msg)
                    break
        except Exception as e:
            add_log("ERROR", f"[QUEUE WORKER ERROR] {str(e)}")

# Startup Event
@app.on_event("startup")
def startup_event():
    init_db()
    archive_legacy_pending_records()
    # Launch background sync worker thread
    worker = threading.Thread(target=sync_worker_thread, daemon=True)
    worker.start()

# --- REST Endpoints ---

@app.get("/")
async def root_info():
    """Root endpoint providing service overview, architecture endpoints, and direct links."""
    return {
        "service": "CloudAnchor Fog Gateway",
        "version": "2.0.0",
        "status": "ONLINE",
        "description": "Fog-Assisted Resilient Gateway for Intermittent Cloud APIs with Multi-Sensor Fusion",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "metrics": "/api/metrics",
            "sensors_summary": "/api/sensors",
            "sensors_history": "/api/sensors/history",
            "multi_sensor_fusion": "/api/fusion/latest",
            "system_logs": "/api/logs",
            "resilience_config": "/api/resilience/config",
            "cloud_control": "/api/resilience/control",
            "sensor_ingest": "/api/ingest (POST)"
        },
        "frontend_dashboard": "http://localhost:5173",
        "simulated_cloud_api": "http://127.0.0.1:8001"
    }

@app.post("/api/ingest")
async def ingest_sensor_data(payload: SensorPayload):
    global GATEWAY_METRICS, ACTIVE_SESSION_ID, LAST_INGESTED_REQ_ID
    req_id = payload.request_id
    dev_id = payload.device_id or "ARDUINO-001"
    timestamp = payload.timestamp or time.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Detect simulation restart (Tinkercad restarted, resetting counter to REQ-1)
    if payload.session_id:
        sess_id = payload.session_id
        ACTIVE_SESSION_ID = sess_id
    else:
        if req_id == "REQ-1" and LAST_INGESTED_REQ_ID is not None and LAST_INGESTED_REQ_ID != "REQ-1":
            ACTIVE_SESSION_ID = f"SIM-{time.strftime('%Y%m%d-%H%M%S')}"
            add_log("INFO", f"[SIMULATION RESTART] Tinkercad simulation restarted. Started session: {ACTIVE_SESSION_ID}")
        sess_id = ACTIVE_SESSION_ID

    LAST_INGESTED_REQ_ID = req_id

    # 2. Duplicate Request Protection / Idempotency Key within active session
    existing = get_record_by_request_id(req_id, session_id=sess_id)
    if existing:
        add_log("WARNING", f"[QUEUE DUPLICATE] Duplicate request {req_id} received in session {sess_id}. Ignored.")
        return {
            "status": "duplicate",
            "message": f"Request {req_id} already exists in local queue",
            "queue_status": existing["status"],
            "request_id": req_id,
            "session_id": sess_id
        }

    # 3. Track metrics and calculate derived values
    GATEWAY_METRICS["total_requests"] += 1
    
    volt = payload.voltage if payload.voltage is not None else 5.0
    curr = payload.current if payload.current is not None else 0.0
    power = payload.power if (payload.power is not None and payload.power > 0.0) else round(volt * (curr / 1000.0), 3)

    # 4. Multi-Sensor Fusion Intelligence Engine
    if payload.health_score is not None and payload.system_status and payload.risk_level:
        fusion_result = {
            "health_score": payload.health_score,
            "system_status": payload.system_status,
            "risk_level": payload.risk_level,
            "warning_reason": payload.warning_reason
        }
    else:
        fusion_result = MultiSensorFusionEngine.evaluate(
            temperature=payload.temperature,
            humidity=payload.humidity,
            voltage=volt,
            current=curr,
            power=power,
            gas_level=payload.gas_level,
            pressure=payload.pressure,
            vibration_level=payload.vibration_level,
            acceleration_x=payload.acceleration_x,
            acceleration_y=payload.acceleration_y,
            acceleration_z=payload.acceleration_z
        )

    log_desc = (
        f"Ingested {req_id} from {dev_id} | Temp: {payload.temperature:.1f}°C | Hum: {payload.humidity:.1f}% | "
        f"Volt: {volt:.2f}V | Curr: {curr:.2f}mA | Power: {power:.3f}W | "
        f"Health: {fusion_result['health_score']}/100 [{fusion_result['system_status']}]"
    )
    add_log("INFO", f"[TELEMETRY RECEIVED] {req_id} from {dev_id} | Temp: {payload.temperature:.1f}°C | Hum: {payload.humidity:.1f}% | Volt: {volt:.2f}V")
    add_log("INFO", f"[QUEUE RECEIVED] {req_id} stored by Fog Gateway in SQLite queue")

    # 5. Update in-memory telemetry cache with RAW + FUSION readings
    telemetry_cache.update(
        device_id=dev_id,
        request_id=req_id,
        temperature=payload.temperature,
        humidity=payload.humidity,
        timestamp=timestamp,
        acceleration_x=clean_float(payload.acceleration_x, 0.0),
        acceleration_y=clean_float(payload.acceleration_y, 0.0),
        acceleration_z=clean_float(payload.acceleration_z, 1.0),
        vibration_level=clean_float(payload.vibration_level, 0.0),
        voltage=volt,
        current=curr,
        power=power,
        gas_level=clean_float(payload.gas_level, None) if payload.gas_level is not None else None,
        pressure=clean_float(payload.pressure, None) if payload.pressure is not None else None,
        health_score=fusion_result["health_score"],
        system_status=fusion_result["system_status"],
        risk_level=fusion_result["risk_level"],
        warning_reason=fusion_result["warning_reason"]
    )

    # 6. Persist to local SQLite queue as PENDING with session_id
    inserted = insert_record(
        request_id=req_id,
        session_id=sess_id,
        device_id=dev_id,
        timestamp=timestamp,
        temperature=payload.temperature,
        humidity=payload.humidity,
        acceleration_x=clean_float(payload.acceleration_x, 0.0),
        acceleration_y=clean_float(payload.acceleration_y, 0.0),
        acceleration_z=clean_float(payload.acceleration_z, 1.0),
        vibration_level=clean_float(payload.vibration_level, 0.0),
        voltage=volt,
        current=curr,
        power=power,
        gas_level=clean_float(payload.gas_level, None) if payload.gas_level is not None else None,
        pressure=clean_float(payload.pressure, None) if payload.pressure is not None else None,
        health_score=fusion_result["health_score"],
        system_status=fusion_result["system_status"],
        risk_level=fusion_result["risk_level"],
        warning_reason=fusion_result["warning_reason"],
        status="PENDING"
    )
    if not inserted:
        add_log("WARNING", f"[QUEUE DUPLICATE] Could not insert duplicate {req_id} in session {sess_id}.")
        return {"status": "duplicate", "message": f"Request {req_id} already exists", "request_id": req_id}

    # 7. Check Circuit Breaker FSM before making outbound network call
    can_attempt, cb_state = circuit_breaker.can_attempt_request()
    if not can_attempt:
        # Fast-fail network call to save CPU and socket exhaustion
        add_log("WARNING", f"[CIRCUIT BREAKER {cb_state}] Cloud unavailable for {req_id}. Fast-failing to SQLite queue.")
        add_log("INFO", f"[QUEUE PENDING] {req_id} retained in local queue for retry")
        GATEWAY_METRICS["failed_requests"] += 1
        return {
            "status": "buffered",
            "message": f"Circuit Breaker {cb_state}. Data saved in local queue",
            "queue_status": "PENDING",
            "request_id": req_id,
            "session_id": sess_id,
            "circuit_breaker_state": cb_state,
            "health_score": fusion_result["health_score"],
            "system_status": fusion_result["system_status"],
            "risk_level": fusion_result["risk_level"],
            "warning_reason": fusion_result["warning_reason"]
        }

    # 8. Attempt direct Cloud forwarding
    cloud_url = f"{GATEWAY_SETTINGS['cloud_url']}/data"
    headers = {"Content-Type": "application/json"}
    
    forward_payload = {
        "request_id": req_id,
        "session_id": sess_id,
        "device_id": dev_id,
        "timestamp": timestamp,
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "acceleration_x": clean_float(payload.acceleration_x, 0.0),
        "acceleration_y": clean_float(payload.acceleration_y, 0.0),
        "acceleration_z": clean_float(payload.acceleration_z, 1.0),
        "vibration_level": clean_float(payload.vibration_level, 0.0),
        "voltage": volt,
        "current": curr,
        "power": power,
        "gas_level": clean_float(payload.gas_level, None) if payload.gas_level is not None else None,
        "pressure": clean_float(payload.pressure, None) if payload.pressure is not None else None,
        "health_score": fusion_result["health_score"],
        "system_status": fusion_result["system_status"],
        "risk_level": fusion_result["risk_level"],
        "warning_reason": fusion_result["warning_reason"]
    }
    
    try:
        response = requests.post(cloud_url, json=forward_payload, headers=headers, timeout=2.0)
        
        if response.status_code in [200, 201]:
            update_status(req_id, "SYNCED", session_id=sess_id)
            GATEWAY_METRICS["success_requests"] += 1
            new_state, transition_msg = circuit_breaker.record_success()
            add_log("SUCCESS", f"[QUEUE SYNCED] {req_id} synchronized to Cloud API")
            if transition_msg:
                add_log("INFO", transition_msg)
            return {
                "status": "success",
                "message": "Data forwarded to cloud",
                "cloud_status_code": response.status_code,
                "queue_status": "SYNCED",
                "request_id": req_id,
                "circuit_breaker_state": new_state,
                "health_score": fusion_result["health_score"],
                "system_status": fusion_result["system_status"]
            }
        elif response.status_code == 400 and "already exists" in response.text:
            update_status(req_id, "SYNCED")
            GATEWAY_METRICS["success_requests"] += 1
            new_state, transition_msg = circuit_breaker.record_success()
            add_log("SUCCESS", f"[QUEUE SYNCED] {req_id} synchronized to Cloud API")
            if transition_msg:
                add_log("INFO", transition_msg)
            return {
                "status": "success",
                "message": "Data already in cloud",
                "cloud_status_code": 200,
                "queue_status": "SYNCED",
                "request_id": req_id,
                "circuit_breaker_state": new_state,
                "health_score": fusion_result["health_score"],
                "system_status": fusion_result["system_status"]
            }
        elif response.status_code == 422:
            err_msg = f"Cloud HTTP 422 Validation Error: {response.text}"
            update_status(req_id, "FAILED", last_error=err_msg)
            GATEWAY_METRICS["failed_requests"] += 1
            circuit_breaker.reset_probing()
            add_log("ERROR", f"[CLOUD VALIDATION ERROR] HTTP 422 for {req_id}: Rejected schema validation. Marked FAILED. Detail: {response.text}")
            return {
                "status": "validation_error",
                "message": "Cloud API rejected schema validation",
                "cloud_status_code": 422,
                "queue_status": "FAILED",
                "request_id": req_id,
                "circuit_breaker_state": cb_state,
                "health_score": fusion_result["health_score"],
                "system_status": fusion_result["system_status"]
            }
        else:
            err_msg = f"Cloud rejected with status {response.status_code}"
            update_status(req_id, "PENDING", last_error=err_msg, increment_retry=True)
            GATEWAY_METRICS["failed_requests"] += 1
            new_state, transition_msg = circuit_breaker.record_failure(err_msg)
            add_log("WARNING", f"[CIRCUIT BREAKER] Cloud unavailable for {req_id} ({err_msg}). Fast-failing to SQLite queue.")
            add_log("INFO", f"[QUEUE PENDING] {req_id} retained in local queue for retry")
            if transition_msg:
                add_log("WARNING", transition_msg)
            return {
                "status": "buffered",
                "message": "Cloud API rejected request. Saved in local queue",
                "cloud_status_code": response.status_code,
                "queue_status": "PENDING",
                "request_id": req_id,
                "circuit_breaker_state": new_state,
                "health_score": fusion_result["health_score"],
                "system_status": fusion_result["system_status"]
            }
            
    except requests.exceptions.RequestException as e:
        err_msg = f"Cloud unreachable: {str(e)}"
        update_status(req_id, "PENDING", last_error=err_msg, increment_retry=True)
        GATEWAY_METRICS["failed_requests"] += 1
        new_state, transition_msg = circuit_breaker.record_failure(err_msg)
        add_log("WARNING", f"[CIRCUIT BREAKER] Cloud unavailable for {req_id}. Fast-failing to SQLite queue.")
        add_log("INFO", f"[QUEUE PENDING] {req_id} retained in local queue for retry")
        if transition_msg:
            add_log("WARNING", transition_msg)
        return {
            "status": "buffered",
            "message": "Cloud API unreachable. Data saved in local queue",
            "queue_status": "PENDING",
            "request_id": req_id,
            "circuit_breaker_state": new_state,
            "health_score": fusion_result["health_score"],
            "system_status": fusion_result["system_status"]
        }

@app.get("/api/metrics")
async def get_metrics():
    cloud_url = GATEWAY_SETTINGS["cloud_url"]
    try:
        res = requests.get(f"{cloud_url}/control", timeout=1.0)
        cloud_api = res.json()
    except Exception:
        cloud_api = {"status": "OFFLINE"}

    counts = get_queue_counts()
    cb_status = circuit_breaker.get_status()

    # Backoff metrics
    pending_records = get_pending_records(limit=1)
    if pending_records:
        record = pending_records[0]
        retry_count = record.get("retry_count", 0) or 0
        delay = backoff_delay(retry_count)
        try:
            last_update = time.strptime(record["updated_at"], "%Y-%m-%d %H:%M:%S")
            last_update_ts = time.mktime(last_update)
        except Exception:
            last_update_ts = time.time()
        elapsed = time.time() - last_update_ts
        next_retry_in = max(0, delay - elapsed)
    else:
        retry_count = 0
        next_retry_in = 0

    latest_cache = telemetry_cache.get_latest()

    return {
        "total_requests": GATEWAY_METRICS["total_requests"],
        "success_requests": GATEWAY_METRICS["success_requests"],
        "failed_requests": GATEWAY_METRICS["failed_requests"],
        "cloud_api": cloud_api,
        "gateway_mode": "NORMAL" if (cloud_api.get("status") == "ONLINE" and cb_status["circuit_breaker_state"] == "CLOSED") else "DEGRADED",
        "pending_queue": counts["pending"],
        "synced_queue": counts["synced"],
        "failed_queue": counts["failed"],
        # Circuit Breaker Telemetry
        "circuit_breaker_state": cb_status["circuit_breaker_state"],
        "consecutive_failures": cb_status["consecutive_failures"],
        "failure_threshold": cb_status["failure_threshold"],
        "cooldown_remaining": cb_status["cooldown_remaining"],
        "probe_successes": cb_status["probe_successes"],
        "required_probe_successes": cb_status["required_probe_successes"],
        # Backoff Metrics
        "base_backoff": BASE_BACKOFF,
        "max_backoff": MAX_BACKOFF,
        "current_retry_count": retry_count,
        "next_retry_in": int(next_retry_in),
        # Latest Multi-Sensor Intelligence State
        "latest_telemetry": latest_cache
    }

@app.get("/api/logs")
async def get_logs():
    return GATEWAY_LOGS

@app.post("/api/logs/clear")
async def clear_logs():
    global GATEWAY_LOGS
    GATEWAY_LOGS.clear()
    return {"status": "cleared", "count": 0}

@app.get("/api/cache/{device_id}")
async def get_cached_telemetry(device_id: str):
    cached = telemetry_cache.get(device_id)
    if cached is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cached telemetry found for device '{device_id}'"
        )
    return cached

@app.get("/api/fusion/latest")
async def get_latest_fusion():
    cached = telemetry_cache.get_latest()
    if not cached:
        return {
            "health_score": 100,
            "system_status": "NORMAL",
            "risk_level": "LOW",
            "warning_reason": None,
            "evaluation_method": "Rule-Based Multi-Sensor Fusion (Awaiting Telemetry)",
            "sensors": {}
        }
    return {
        "health_score": cached.get("health_score", 100),
        "system_status": cached.get("system_status", "NORMAL"),
        "risk_level": cached.get("risk_level", "LOW"),
        "warning_reason": cached.get("warning_reason"),
        "evaluation_method": "Rule-Based Multi-Sensor Fusion",
        "device_id": cached.get("device_id"),
        "timestamp": cached.get("timestamp"),
        "sensor_status": cached.get("sensor_status", {}),
        "raw_readings": {
            "temperature": cached.get("temperature"),
            "humidity": cached.get("humidity"),
            "vibration_level": cached.get("vibration_level"),
            "voltage": cached.get("voltage"),
            "current": cached.get("current"),
            "power": cached.get("power"),
            "gas_level": cached.get("gas_level"),
            "pressure": cached.get("pressure")
        }
    }

@app.get("/api/resilience/config")
async def get_resilience_config():
    with circuit_breaker._lock:
        return {
            "failure_threshold": circuit_breaker.failure_threshold,
            "cooldown_duration": circuit_breaker.cooldown_seconds,
            "max_backoff": MAX_BACKOFF
        }

@app.post("/api/resilience/config")
async def update_resilience_config(payload: ResilienceConfigPayload):
    global MAX_BACKOFF
    
    if payload.failure_threshold is not None:
        if not (1 <= payload.failure_threshold <= 10):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="failure_threshold must be between 1 and 10"
            )
            
    if payload.cooldown_duration is not None:
        if not (1 <= payload.cooldown_duration <= 300):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cooldown_duration must be between 1 and 300 seconds"
            )
            
    if payload.max_backoff is not None:
        if not (2 <= payload.max_backoff <= 300):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_backoff must be between 2 and 300 seconds"
            )

    with circuit_breaker._lock:
        if payload.failure_threshold is not None:
            circuit_breaker.failure_threshold = int(payload.failure_threshold)
        if payload.cooldown_duration is not None:
            circuit_breaker.cooldown_seconds = float(payload.cooldown_duration)
            
    if payload.max_backoff is not None:
        MAX_BACKOFF = int(payload.max_backoff)

    add_log(
        "INFO",
        f"Resilience Config Updated: Failure Threshold={circuit_breaker.failure_threshold}, "
        f"Cooldown={circuit_breaker.cooldown_seconds}s, Max Backoff={MAX_BACKOFF}s"
    )

    return {
        "status": "success",
        "message": "Resilience configuration updated",
        "config": {
            "failure_threshold": circuit_breaker.failure_threshold,
            "cooldown_duration": circuit_breaker.cooldown_seconds,
            "max_backoff": MAX_BACKOFF
        }
    }

@app.post("/api/resilience/control")
async def control_resilience(payload: CloudStatePayload):
    cloud_url = GATEWAY_SETTINGS["cloud_url"]
    try:
        res = requests.post(f"{cloud_url}/control", json=payload.model_dump(), timeout=1.5)
        add_log("INFO", f"Administrative Action: Toggled Simulated Cloud Status to {payload.status}")
        return res.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to contact Cloud API: {str(e)}"
        )

@app.get("/api/sensors")
async def get_sensors_summary():
    cached = telemetry_cache.get_latest()
    
    if cached:
        last_seen_sec = cached.get("last_updated_sec_ago", 0)
        is_stale = last_seen_sec > 10.0
    else:
        last_seen_sec = None
        is_stale = True

    sensors = [
        {
            "id": "dht22",
            "name": "DHT22",
            "type": "Temperature & Humidity Sensor",
            "status": "ONLINE" if (cached and not is_stale) else ("STALE" if cached else "WAITING_FOR_DATA"),
            "category": "PRIMARY",
            "parameters": [
                {"name": "Temperature", "key": "temperature", "unit": "°C", "value": cached.get("temperature") if cached else None},
                {"name": "Humidity", "key": "humidity", "unit": "%", "value": cached.get("humidity") if cached else None}
            ],
            "last_updated_sec_ago": last_seen_sec,
            "sampling_rate": "2.0s - 3.0s"
        },
        {
            "id": "mpu6050",
            "name": "MPU6050",
            "type": "Motion & Vibration Sensor (6-DoF)",
            "status": "ONLINE" if (cached and not is_stale) else ("STALE" if cached else "WAITING_FOR_DATA"),
            "category": "PRIMARY",
            "parameters": [
                {"name": "Acceleration X", "key": "acceleration_x", "unit": "g", "value": cached.get("acceleration_x") if cached else None},
                {"name": "Acceleration Y", "key": "acceleration_y", "unit": "g", "value": cached.get("acceleration_y") if cached else None},
                {"name": "Acceleration Z", "key": "acceleration_z", "unit": "g", "value": cached.get("acceleration_z") if cached else None},
                {"name": "Vibration Level", "key": "vibration_level", "unit": "g", "value": cached.get("vibration_level") if cached else None}
            ],
            "last_updated_sec_ago": last_seen_sec,
            "sampling_rate": "2.0s - 3.0s"
        },
        {
            "id": "ina219",
            "name": "INA219",
            "type": "Voltage / Current / Power Monitor",
            "status": "ONLINE" if (cached and not is_stale) else ("STALE" if cached else "WAITING_FOR_DATA"),
            "category": "PRIMARY",
            "parameters": [
                {"name": "Bus Voltage", "key": "voltage", "unit": "V", "value": cached.get("voltage") if cached else None},
                {"name": "Shunt Current", "key": "current", "unit": "mA", "value": cached.get("current") if cached else None},
                {"name": "Power Draw", "key": "power", "unit": "W", "value": cached.get("power") if cached else None}
            ],
            "last_updated_sec_ago": last_seen_sec,
            "sampling_rate": "2.0s - 3.0s"
        },
        {
            "id": "mq2",
            "name": "MQ-2",
            "type": "Combustible Gas & Smoke Sensor",
            "status": "ONLINE" if (cached and cached.get("gas_level") is not None and not is_stale) else ("CONFIGURED" if (cached and cached.get("gas_level") is not None) else "OPTIONAL_PLANNED"),
            "category": "SECONDARY",
            "parameters": [
                {"name": "Gas Concentration", "key": "gas_level", "unit": "ppm", "value": cached.get("gas_level") if cached else None}
            ],
            "last_updated_sec_ago": last_seen_sec if (cached and cached.get("gas_level") is not None) else None,
            "sampling_rate": "Configurable"
        },
        {
            "id": "bmp280",
            "name": "BMP280",
            "type": "Atmospheric Pressure & Temperature",
            "status": "ONLINE" if (cached and cached.get("pressure") is not None and not is_stale) else ("CONFIGURED" if (cached and cached.get("pressure") is not None) else "OPTIONAL_PLANNED"),
            "category": "SECONDARY",
            "parameters": [
                {"name": "Barometric Pressure", "key": "pressure", "unit": "hPa", "value": cached.get("pressure") if cached else None}
            ],
            "last_updated_sec_ago": last_seen_sec if (cached and cached.get("pressure") is not None) else None,
            "sampling_rate": "Configurable"
        }
    ]
    
    return {
        "sensors": sensors,
        "total_sensors": len(sensors),
        "active_sensors": sum(1 for s in sensors if s["status"] == "ONLINE"),
        "warning_sensors": 1 if (cached and cached.get("system_status") == "WARNING") else 0,
        "offline_sensors": sum(1 for s in sensors if s["status"] in ["STALE", "OFFLINE"]),
        "last_updated_sec_ago": last_seen_sec
    }

@app.get("/api/sensors/history")
async def get_sensors_history(limit: int = 50):
    records = get_recent_records(limit=limit)
    return records

@app.post("/api/queue/archive-legacy")
async def archive_legacy_queue():
    """Administrative maintenance endpoint to safely mark legacy/invalid test records as FAILED."""
    count = archive_legacy_pending_records()
    add_log("INFO", f"[ADMIN QUEUE ARCHIVE] Safely archived {count} legacy test records to FAILED.")
    return {"status": "success", "archived_count": count, "counts": get_queue_counts()}

@app.post("/api/queue/clear-failed")
async def clear_failed_queue():
    """Administrative maintenance endpoint to clean FAILED records for clean demo runs."""
    count = clear_failed_records()
    add_log("INFO", f"[ADMIN QUEUE CLEAN] Cleared {count} FAILED records.")
    return {"status": "success", "cleared_count": count, "counts": get_queue_counts()}


