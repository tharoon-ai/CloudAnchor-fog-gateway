# CloudAnchor Technical Architecture & Multi-Sensor Fusion Specification

## 1. Executive Summary

**CloudAnchor** is a Fog-Assisted Resilient IoT Gateway engineered to guarantee 100% data reliability, zero data loss, and rule-based edge intelligence in intermittent cloud environments. 

By inserting an intelligent Fog Gateway layer between IoT Edge Nodes (ESP32 microcontrollers hosting multi-sensor payloads) and upstream Cloud APIs, CloudAnchor decouples edge ingestion from wide-area network volatility.

---

## 2. Multi-Sensor System Architecture

```
                                  CLOUD LAYER
                        ┌─────────────────────────────┐
                        │          Cloud API          │
                        │     FastAPI (Port 8001)     │
                        │     SQLite (cloud.db)       │
                        └──────────────┬──────────────┘
                                       │
                                  WAN / Internet
                                       │
                                       ▼
                                   FOG LAYER
                        ┌─────────────────────────────┐
                        │     CloudAnchor Fog Gateway │
                        │     FastAPI (Port 8000)     │
                        │     SQLite (gateway.db)     │
                        ├─────────────────────────────┤
                        │ 1. Schema Validation Layer  │
                        │ 2. Rule-Based Fusion Engine │
                        │ 3. Thread-Safe WAL Storage  │
                        │ 4. Circuit Breaker FSM      │
                        │ 5. Exponential Backoff Sync │
                        │ 6. In-Memory Freshness Cache│
                        └──────────────┬──────────────┘
                                       │
                                 Local Network / LAN
                                       │
                                       ▼
                                  EDGE LAYER
                        ┌─────────────────────────────┐
                        │      ESP32 Microcontroller  │
                        │  I2C / ADC Sensor Interface │
                        ├──────────────┬──────────────┤
                        │ DHT22        │ Temp / Hum   │
                        │ MPU6050      │ Accel / Vib  │
                        │ INA219       │ V / I / Power│
                        │ MQ-2         │ Gas / Smoke  │
                        │ BMP280       │ Barometer    │
                        └──────────────┴──────────────┘
```

---

## 3. Sensor Hardware & Bus Specification

| Sensor | Physical Interface | Measured Parameters | Measurement Range | Operating Role |
| :--- | :--- | :--- | :--- | :--- |
| **DHT22 / AM2302** | 1-Wire Digital (GPIO 15) | Temperature, Relative Humidity | -40 to +80°C (±0.5°C), 0–100% RH | Ambient thermal and moisture tracking |
| **MPU6050** | I2C (SDA: 21, SCL: 22, 0x68) | Acceleration X, Y, Z, Vibration Index | ±2g to ±16g, 6-DOF dynamic deviation | Mechanical vibration and structural anomaly detection |
| **INA219** | I2C (SDA: 21, SCL: 22, 0x40) | Bus Voltage, Shunt Current, Power | 0–32V, 0–3.2A (0.1mA resolution) | Electrical loading, power surge, and brownout monitoring |
| **MQ-2** | Analog ADC1 (GPIO 34) | Gas & Smoke Concentration | 100–10,000 ppm (LPG, smoke, methane) | Environmental hazardous air quality warning |
| **BMP280** | I2C (SDA: 21, SCL: 22, 0x76) | Barometric Pressure, Temperature | 300–1100 hPa (±1 hPa accuracy) | Altitude and weather-induced barometric tracking |

---

## 4. Rule-Based Multi-Sensor Fusion Engine

The Edge Intelligence layer executes at the Fog Gateway prior to local persistence or cloud forwarding. It processes raw multi-sensor vectors to compute derived diagnostic indicators without requiring cloud-dependent ML inference.

### Evaluation Metrics:
1. **Health Score (\(0 \le S \le 100\))**:
   $$\text{Health Score} = \max\left(0, 100 - \sum \text{Deductions}\right)$$
   - *Thermal Deduction*: Overheating (>65°C: -40 pts; >45°C: -18 pts).
   - *Vibration Deduction*: High mechanical vibration (>0.75g: -40 pts; >0.35g: -18 pts).
   - *Electrical Deduction*: Current overload (>900mA: -35 pts; >500mA: -16 pts).
   - *Gas Deduction*: Smoke/Hazardous gas (>750 ppm: -45 pts; >450 ppm: -20 pts).
   - *Barometric Deduction*: Pressure anomalies (<980 hPa or >1040 hPa: -8 pts).

2. **System Status Classification**:
   - `NORMAL`: Health Score > 75, zero critical or warning condition breaches.
   - `WARNING`: Health Score 46–75, or one or more warning threshold excursions.
   - `CRITICAL`: Health Score \(\le 45\), or any severe safety violation (overheating, hazardous gas, current spike).

3. **Risk Level**: `LOW` | `MEDIUM` | `HIGH`.
4. **Warning Reason**: Explainable, human-readable concatenation of all anomaly triggers (e.g., `"Elevated vibration (0.45g) and high current (620mA) detected"`).

---

## 5. Storage & Resilience Pipeline

### 5.1 SQLite Store-and-Forward Queue (`gateway.db`)
- Every telemetry packet is persisted in SQLite with `PRAGMA journal_mode = WAL;` and `PRAGMA synchronous = NORMAL;`.
- Strict schema stores all **11 Raw Sensor Columns** plus **4 Derived Fusion Columns**.
- `request_id` serves as an immutable, indexed idempotency key preventing duplicate queueing.

### 5.2 Circuit Breaker Finite State Machine (FSM)
- `CLOSED`: Normal proxying. Outbound HTTP calls forward directly to Cloud API.
- `OPEN`: Trips after \(N\) (default: 3) consecutive failures. Gateway fast-fails outbound calls and immediately commits records to `gateway.db` with status `PENDING`.
- `HALF-OPEN`: Enters trial recovery after cooldown duration (default: 10s). Forwards \(M\) (default: 2) probe requests. If successful, transitions to `CLOSED` and unlocks background queue draining.

### 5.3 Exponential Backoff FIFO Sync Worker
When cloud recovers, the worker executes background batch draining in strict FIFO chronological sequence with exponential backoff:
$$\text{Delay}(r) = \min\left(\text{BaseBackoff} \times 2^r, \text{MaxBackoff}\right)$$
Where \(r\) is the record's retry attempt count.

---

## 6. End-to-End Data Flow

```
1. Sensor Read (ESP32 DHT22 + MPU6050 + INA219 + MQ-2 + BMP280)
   └── Formats structured JSON with unique REQ-xxxx ID
2. Gateway Ingestion (POST /api/ingest)
   ├── Schema range validation
   ├── Rule-Based Multi-Sensor Fusion calculation
   ├── In-Memory cache update
   ├── Local SQLite queue insertion (PENDING)
   └── Circuit Breaker outbound evaluation
        ├── If CLOSED: Forward to Cloud API (:8001/data) -> Mark SYNCED
        └── If OPEN / Offline: Fast-fail -> Leave PENDING in SQLite
3. Cloud Synchronization
   ├── Background FIFO worker retries with exponential backoff
   ├── Cloud API inserts to cloud.db enforcing idempotency
   └── Gateway marks record as SYNCED
4. Real-time Dashboard Monitoring (React 19 + Vite)
   ├── Multi-sensor gauges, statuses, and timeseries charts
   ├── Rule-based health score progress and anomaly alert banner
   └── Live resilience controls, chaos tests, and database inspector
```
