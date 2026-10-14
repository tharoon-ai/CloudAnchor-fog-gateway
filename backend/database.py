import os
import sqlite3
import time
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "gateway.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Create table with full multi-sensor schema
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT DEFAULT 'SIM-DEFAULT',
            request_id TEXT NOT NULL,
            device_id TEXT NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            timestamp TEXT NOT NULL,
            
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
            
            -- Queue Management & Resilience State
            status TEXT NOT NULL CHECK(status IN ('RECEIVED', 'PENDING', 'SYNCED', 'FAILED')),
            retry_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_error TEXT
        )
    """)

    # 2. Schema Migration check: remove standalone UNIQUE constraint on request_id if present from old schema
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='sensor_queue'")
    table_sql = cursor.fetchone()[0] if cursor.rowcount != 0 else ""
    if "request_id TEXT UNIQUE" in table_sql:
        cursor.execute("""
            CREATE TABLE sensor_queue_migrated (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT DEFAULT 'SIM-DEFAULT',
                request_id TEXT NOT NULL,
                device_id TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL,
                timestamp TEXT NOT NULL,
                acceleration_x REAL DEFAULT 0.0,
                acceleration_y REAL DEFAULT 0.0,
                acceleration_z REAL DEFAULT 1.0,
                vibration_level REAL DEFAULT 0.0,
                voltage REAL DEFAULT 5.0,
                current REAL DEFAULT 0.0,
                power REAL DEFAULT 0.0,
                gas_level REAL,
                pressure REAL,
                health_score INTEGER DEFAULT 100,
                system_status TEXT DEFAULT 'NORMAL',
                risk_level TEXT DEFAULT 'LOW',
                warning_reason TEXT,
                status TEXT NOT NULL CHECK(status IN ('RECEIVED', 'PENDING', 'SYNCED', 'FAILED')),
                retry_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_error TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO sensor_queue_migrated 
            SELECT id, 
                   COALESCE(session_id, 'SIM-DEFAULT'),
                   request_id, device_id, temperature, humidity, timestamp,
                   acceleration_x, acceleration_y, acceleration_z, vibration_level,
                   voltage, current, power, gas_level, pressure,
                   health_score, system_status, risk_level, warning_reason,
                   status, retry_count, created_at, updated_at, last_error
            FROM sensor_queue
        """)
        cursor.execute("DROP TABLE sensor_queue")
        cursor.execute("ALTER TABLE sensor_queue_migrated RENAME TO sensor_queue")

    # 3. Create indices for high-performance FIFO drain and deduplication
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_sensor_queue_status_id 
        ON sensor_queue (status, id)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_sensor_queue_session_req 
        ON sensor_queue (session_id, request_id)
    """)

    conn.commit()
    conn.close()

def get_record_by_request_id(request_id: str, session_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if session_id:
        cursor.execute("SELECT * FROM sensor_queue WHERE session_id = ? AND request_id = ? ORDER BY id DESC LIMIT 1", (session_id, request_id))
    else:
        cursor.execute("SELECT * FROM sensor_queue WHERE request_id = ? ORDER BY id DESC LIMIT 1", (request_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def insert_record(
    request_id: str,
    device_id: str,
    temperature: float,
    humidity: float,
    timestamp: str,
    session_id: str = "SIM-DEFAULT",
    acceleration_x: float = 0.0,
    acceleration_y: float = 0.0,
    acceleration_z: float = 1.0,
    vibration_level: float = 0.0,
    voltage: float = 5.0,
    current: float = 0.0,
    power: float = 0.0,
    gas_level: Optional[float] = None,
    pressure: Optional[float] = None,
    health_score: int = 100,
    system_status: str = "NORMAL",
    risk_level: str = "LOW",
    warning_reason: Optional[str] = None,
    status: str = "PENDING"
) -> bool:
    """Insert incoming multi-sensor telemetry with session tracking and fusion assessment into SQLite queue."""
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check if this exact session_id + request_id already exists
        cursor.execute("SELECT id FROM sensor_queue WHERE session_id = ? AND request_id = ?", (session_id, request_id))
        if cursor.fetchone():
            conn.close()
            return False

        cursor.execute("""
            INSERT INTO sensor_queue (
                session_id, request_id, device_id, temperature, humidity, timestamp,
                acceleration_x, acceleration_y, acceleration_z, vibration_level,
                voltage, current, power,
                gas_level, pressure,
                health_score, system_status, risk_level, warning_reason,
                status, retry_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        """, (
            session_id, request_id, device_id,
            temperature, humidity, timestamp,
            acceleration_x, acceleration_y, acceleration_z, vibration_level,
            voltage, current, power,
            gas_level, pressure,
            health_score, system_status, risk_level, warning_reason,
            status, now, now
        ))
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error:
        conn.close()
        return False

def update_status(
    request_id: str,
    status: str,
    last_error: Optional[str] = None,
    increment_retry: bool = False,
    session_id: Optional[str] = None,
    record_id: Optional[int] = None
):
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cursor = conn.cursor()
    if record_id:
        if increment_retry:
            cursor.execute("""
                UPDATE sensor_queue
                SET status = ?, last_error = ?, retry_count = retry_count + 1, updated_at = ?
                WHERE id = ?
            """, (status, last_error, now, record_id))
        else:
            retry_expr = "0" if status == "SYNCED" else "retry_count"
            cursor.execute(f"""
                UPDATE sensor_queue
                SET status = ?, last_error = ?, retry_count = {retry_expr}, updated_at = ?
                WHERE id = ?
            """, (status, last_error, now, record_id))
    elif session_id:
        if increment_retry:
            cursor.execute("""
                UPDATE sensor_queue
                SET status = ?, last_error = ?, retry_count = retry_count + 1, updated_at = ?
                WHERE session_id = ? AND request_id = ?
            """, (status, last_error, now, session_id, request_id))
        else:
            retry_expr = "0" if status == "SYNCED" else "retry_count"
            cursor.execute(f"""
                UPDATE sensor_queue
                SET status = ?, last_error = ?, retry_count = {retry_expr}, updated_at = ?
                WHERE session_id = ? AND request_id = ?
            """, (status, last_error, now, session_id, request_id))
    else:
        if increment_retry:
            cursor.execute("""
                UPDATE sensor_queue
                SET status = ?, last_error = ?, retry_count = retry_count + 1, updated_at = ?
                WHERE id = (SELECT id FROM sensor_queue WHERE request_id = ? ORDER BY id DESC LIMIT 1)
            """, (status, last_error, now, request_id))
        else:
            retry_expr = "0" if status == "SYNCED" else "retry_count"
            cursor.execute(f"""
                UPDATE sensor_queue
                SET status = ?, last_error = ?, retry_count = {retry_expr}, updated_at = ?
                WHERE id = (SELECT id FROM sensor_queue WHERE request_id = ? ORDER BY id DESC LIMIT 1)
            """, (status, last_error, now, request_id))
    conn.commit()
    conn.close()

def get_pending_records(limit: int = 20, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if session_id:
        cursor.execute("""
            SELECT * FROM sensor_queue
            WHERE status = 'PENDING' AND session_id = ?
            ORDER BY id ASC
            LIMIT ?
        """, (session_id, limit))
    else:
        cursor.execute("""
            SELECT * FROM sensor_queue
            WHERE status = 'PENDING'
            ORDER BY id ASC
            LIMIT ?
        """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_queue_counts(session_id: Optional[str] = None) -> Dict[str, int]:
    conn = get_connection()
    cursor = conn.cursor()
    if session_id:
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'SYNCED' THEN 1 ELSE 0 END) AS synced,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed,
                COUNT(*) AS total
            FROM sensor_queue
            WHERE session_id = ?
        """, (session_id,))
    else:
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'SYNCED' THEN 1 ELSE 0 END) AS synced,
                SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed,
                COUNT(*) AS total
            FROM sensor_queue
        """)
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "pending": row["pending"] or 0,
            "synced": row["synced"] or 0,
            "failed": row["failed"] or 0,
            "total": row["total"] or 0
        }
    return {"pending": 0, "synced": 0, "failed": 0, "total": 0}

def get_recent_records(limit: int = 15, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if session_id:
        cursor.execute("""
            SELECT * FROM sensor_queue
            WHERE session_id = ?
            ORDER BY id DESC
            LIMIT ?
        """, (session_id, limit))
    else:
        cursor.execute("""
            SELECT * FROM sensor_queue
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def archive_legacy_pending_records() -> int:
    """
    Safely archives legacy simulator records (e.g. REQ-406*, REQ-224*, REQ-UNIT-, ESP32-*, ARDUINO-002, SIM-DEFAULT)
    by setting their status to 'FAILED' so they do not block active FIFO sync or pollute the live stream.
    Does NOT delete any historical data.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE sensor_queue
        SET status = 'FAILED', last_error = 'Legacy simulator record archived'
        WHERE status = 'PENDING' AND (
            session_id = 'SIM-DEFAULT' OR
            request_id LIKE 'REQ-406%' OR
            request_id LIKE 'REQ-224%' OR
            request_id LIKE 'REQ-UNIT-%' OR
            request_id LIKE 'REQ-FIFO-%' OR
            request_id LIKE 'REQ-DUP-%' OR
            device_id IN ('ESP32-001', 'ESP32-002', 'ARDUINO-002') OR
            typeof(humidity) = 'text' OR
            typeof(temperature) = 'text'
        )
    """)
    archived_count = cursor.rowcount
    conn.commit()
    conn.close()
    return archived_count

def clear_failed_records() -> int:
    """
    Removes FAILED records if explicitly requested for clean demonstration.
    Does NOT remove SYNCED or PENDING records.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sensor_queue WHERE status = 'FAILED'")
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted_count
