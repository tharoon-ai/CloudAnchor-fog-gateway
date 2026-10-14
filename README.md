# CloudAnchor: A Fog-Assisted Resilient Gateway for Intermittent Cloud APIs

CloudAnchor is an academic software prototype exploring how a local **fog gateway** can receive telemetry, retain records in local SQLite storage when a cloud API is unavailable, and retry synchronization when the cloud destination becomes available again.

The repository includes a FastAPI fog gateway, a separate local Cloud API, a React/Vite dashboard, a Python telemetry simulator, Tinkercad Arduino files, Wokwi ESP32 simulation files, and unit tests.

> **Project status:** This is a development/demo prototype, not a production-ready or safety-critical system. Do not claim “zero data loss” or “100% reliability” unless repeatable tests verify that result. Some sensor values are simulated or derived, not physical sensor measurements.

## Contents

1. [Project structure](#1-project-structure)
2. [Architecture and data flow](#2-architecture-and-data-flow)
3. [Requirements](#3-requirements)
4. [First-time setup](#4-first-time-setup)
5. [Run the project in separate terminals](#5-run-the-project-in-separate-terminals)
6. [Send test telemetry](#6-send-test-telemetry)
7. [Test cloud outage and recovery](#7-test-cloud-outage-and-recovery)
8. [Run the tests](#8-run-the-tests)
9. [Troubleshooting](#9-troubleshooting)
10. [GitHub and security checklist](#10-github-and-security-checklist)
11. [Current scope and limitations](#11-current-scope-and-limitations)

---

## 1. Project structure

The repository's current top-level layout is:

```text
CloudAnchor-fog-gateway/
├── ARCHITECTURE.md
├── README.md
├── requirements.txt
├── run_all.ps1
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── circuit_breaker.py
│   ├── multi_sensor_fusion.py
│   └── telemetry_cache.py
├── cloud_api/
│   └── main.py
├── frontend/
│   ├── package.json
│   └── src/
├── simulator/
│   └── device_simulator.py
├── tests/
├── tinkercad/
│   ├── arduino_telemetry.ino
│   └── tinkercad_bridge.py
└── wokwi-device/
    ├── diagram.json
    ├── libraries.txt
    └── wokwi-device.ino
```

The `frontend` folder contains the dashboard source. The `simulator` folder contains a Python telemetry simulator. The `tinkercad` and `wokwi-device` folders contain simulation-related files; they represent different simulation paths, so follow the instructions for the source you actually intend to use.

## 2. Architecture and data flow

```text
Telemetry source
  ├── Python simulator (simulator/device_simulator.py)
  ├── Tinkercad Arduino files (tinkercad/)
  └── Wokwi ESP32 files (wokwi-device/)
             |
             v
FastAPI Fog Gateway (port 8000)
             |
             +--> Validate and process incoming telemetry
             |
             +--> Retain records / queue state in local SQLite
             |
             +--> Retry and synchronization logic
                          |
                          v
                 Cloud API (port 8001, local demo)

Optional React/Vite dashboard (commonly port 5173)
```

The intended resilience demonstration is: submit a telemetry record, make the cloud destination unavailable while leaving the gateway running, submit another record, verify that the gateway retained it locally, restore the cloud destination, then confirm the same record is synchronized.

**Important:** A successful HTTP response from the gateway does not by itself prove that cloud synchronization completed. Verify the queue/database, backend logs, or the cloud-side record.

## 3. Requirements

Install these tools on your Windows development computer:

- Python 3 and `pip`
- Node.js and `npm` for the frontend and `npx`-based tools
- Git (for retrieving or updating the repository)
- A modern browser
- Tinkercad or Wokwi access only if you plan to use those simulations

Check availability in PowerShell:

```powershell
python --version
python -m pip --version
node --version
npm --version
git --version
```

The commands below assume the repository is located at:

```text
C:\CloudAnchor-fog-gateway
```

If you placed it somewhere else, change the `cd` paths accordingly.

## 4. First-time setup

### 4.1 Open the project root

```powershell
cd C:\CloudAnchor-fog-gateway
Get-ChildItem
```

You should see folders such as `backend`, `cloud_api`, `frontend`, `simulator`, `tests`, `tinkercad`, and `wokwi-device`.

### 4.2 Create a Python virtual environment

Run once from the project root:

```powershell
python -m venv .venv
```

Activate it in each new PowerShell terminal that will run Python services:

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this command in that terminal, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 4.3 Install Python dependencies

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Repeat the activation step in each new terminal before running Python commands. You normally do not need to recreate the virtual environment each time.

### 4.4 Install frontend dependencies

Run this once, or again whenever the frontend dependency list changes:

```powershell
cd C:\CloudAnchor-fog-gateway\frontend
npm install
```

## 5. Run the project in separate terminals

**Open a separate PowerShell terminal for each service and leave it running.** Start the Cloud API first when the gateway is configured to use the local Cloud API. Start the gateway next. Run only one telemetry source at a time while testing, so that test records are easier to identify.

### Terminal 1 — Local Cloud API (port 8001)

This service is part of the repository at `cloud_api/main.py`.

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python -m uvicorn cloud_api.main:app --host 127.0.0.1 --port 8001
```

Keep the terminal open. If it starts successfully, open the API documentation at:

`http://127.0.0.1:8001/docs`

If this service fails to start, read the error in this terminal before proceeding. The gateway must be configured to use the correct cloud API address for synchronization to work.

### Terminal 2 — FastAPI Fog Gateway (port 8000)

Open a **new** PowerShell terminal:

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Keep the terminal open. Check the gateway API documentation:

`http://127.0.0.1:8000/docs`

The local gateway should be running before you submit telemetry or start a tunnel. If the command reports an import error, check that `backend/main.py` exists and that the FastAPI application is exposed as `app`.

### Terminal 3 — LocalTunnel (only if a remote bridge needs to reach your local gateway)

Open a **new** PowerShell terminal:

```powershell
npx localtunnel --port 8000
```

If successful, LocalTunnel prints a temporary HTTPS URL, for example:

```text
https://your-generated-name.loca.lt
```

Use the exact URL printed in your own terminal. Keep the terminal open while you need the tunnel. The URL can change when LocalTunnel restarts. Do not add `:8000` to the public HTTPS URL.

If all telemetry is submitted by a Python process on the same computer, a tunnel may not be necessary; use the local gateway URL if the sending code supports it. Never publish a temporary tunnel URL as if it were a permanent endpoint.

### Terminal 4 — Choose a telemetry source

Use **one option at a time** during a test.

#### Option A: Python simulator (included in the repository)

Open a **new** PowerShell terminal:

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python simulator/device_simulator.py --interval 2.5 --devices 2
```

This is the repository's local simulator command. Check the script's command-line options if you want to change the interval or number of simulated devices. Use this option when you want to test ingestion without opening Tinkercad.

#### Option B: Tinkercad Arduino files

The repository includes:

- `tinkercad/arduino_telemetry.ino`
- `tinkercad/tinkercad_bridge.py`

Open `tinkercad/arduino_telemetry.ino` in your Tinkercad Arduino Uno simulation and start the simulation there. The exact way the Python bridge receives or forwards data depends on the code in `tinkercad/tinkercad_bridge.py`; inspect its configuration and comments before running it. If it is intended to be run as a standalone Python script, start it from the repository root in a separate terminal:

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python .\tinkercad\tinkercad_bridge.py
```

Do not describe this as a direct Windows COM-port connection to Tinkercad's Serial Monitor unless that transport has actually been implemented and tested. If using the manual Tkinter bridge from a separate local folder, note that `serial-bridge/bridge.py` is **not present in the current repository tree** shown above; add the intended bridge source to the repository before documenting it as a tracked component.

#### Option C: Wokwi ESP32 simulation

The repository also includes Wokwi files in `wokwi-device/`. Open `wokwi-device/diagram.json` and `wokwi-device/wokwi-device.ino` in the appropriate Wokwi project and follow the wiring and libraries defined there. This is a separate simulation path from the Tinkercad Arduino Uno option; use it only if this is the source you are testing.

### Terminal 5 — Frontend dashboard (optional, commonly port 5173)

Open a **new** PowerShell terminal:

```powershell
cd C:\CloudAnchor-fog-gateway\frontend
npm run dev
```

The terminal prints the dashboard URL. Open the **actual URL printed**, which is commonly `http://localhost:5173` for Vite. Keep the terminal open while using the dashboard.

If the dashboard opens but does not show current data, check the frontend API configuration and browser console. The dashboard should use real backend responses; static sample events are not proof of live ingestion or synchronization.

### Optional: repository launcher script

The project root includes `run_all.ps1`. If you want to use the bundled launcher, inspect its commands first and then run it from the project root:

```powershell
cd C:\CloudAnchor-fog-gateway
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\run_all.ps1
```

Use either the launcher or the separate-terminal workflow while debugging—not both at the same time—so that you do not accidentally start duplicate services on the same ports.

## 6. Send test telemetry

1. Confirm that the Fog Gateway is running and that `http://127.0.0.1:8000/docs` opens.
2. Start one telemetry source using Terminal 4.
3. Submit or generate one test record.
4. Note the request ID and the response from the source/gateway.
5. Check the gateway terminal for request processing.
6. If using the dashboard, confirm that it is querying the live backend.
7. Check queue status or cloud-side storage separately to determine whether the record has been synchronized.

For a direct API request, use the request schema shown in `http://127.0.0.1:8000/docs`. The exact required JSON fields are defined by the currently running backend; avoid copying a stale sample payload that may not match the schema.

## 7. Test cloud outage and recovery

Use a controlled local test. Do not disrupt a real production cloud service.

### A. Normal operation

1. Start Terminal 1 (Cloud API) and Terminal 2 (Fog Gateway).
2. Start one telemetry source.
3. Send a record and note its request ID.
4. Verify the gateway accepted it and determine whether synchronization succeeded.

### B. Simulate the cloud destination going offline

1. Leave the Fog Gateway running.
2. In **Terminal 1 only**, press `Ctrl+C` to stop the local Cloud API.
3. Submit another telemetry record.
4. Inspect the gateway response, logs, and local SQLite/queue state to see whether it remains pending.

Do not stop the gateway during this test: the purpose is to test retention at the gateway while the cloud destination is unavailable.

### C. Restore cloud and verify synchronization

Restart the Cloud API in Terminal 1 using the same command:

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python -m uvicorn cloud_api.main:app --host 127.0.0.1 --port 8001
```

Then inspect gateway logs, queue state, or cloud-side storage. Verify that the **same request ID** from the outage test reaches the synchronized state and that the record is not duplicated. A green dashboard indicator alone is not sufficient proof of recovery.

## 8. Run the tests

From the project root, activate the virtual environment and run the unit tests:

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python -m unittest discover -s tests -v
```

The repository contains test files for areas including the circuit breaker, queue, telemetry ingestion, fusion logic, backoff, and cache. The test command reports the actual result on your machine; do not claim that all tests pass unless the run completes successfully.

## 9. Troubleshooting

### `ModuleNotFoundError` or missing package

```powershell
cd C:\CloudAnchor-fog-gateway
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Make sure you use the same Python environment for installing dependencies and running the service.

### `Error loading ASGI app` or `Could not import module`

Check the working directory and the target module. The expected targets in this repository are:

- Gateway: `backend.main:app`
- Local Cloud API: `cloud_api.main:app`

Confirm the corresponding file exists and exposes an application named `app`.

### Port 8000 or 8001 is already in use

Find the listener before stopping anything:

```powershell
netstat -ano | findstr :8000
netstat -ano | findstr :8001
```

The last column is the process ID (PID). Inspect it before stopping it:

```powershell
tasklist /FI "PID eq YOUR_PID_HERE"
```

Replace `YOUR_PID_HERE` with the actual PID. Only terminate a process after confirming it is an old CloudAnchor process that you intend to stop.

### LocalTunnel URL does not work

- Confirm Terminal 2 is still running on port 8000.
- Confirm Terminal 3 is still running.
- Copy the newest LocalTunnel URL.
- Do not append `:8000` to the public HTTPS URL.
- Make sure the sending code uses the correct URL and endpoint path.

### The gateway accepts a request but the dashboard does not update

Check the browser console and `frontend/src/services/api.ts` for the API base URL. Confirm the gateway returns the record and that the dashboard is reading actual backend data rather than static sample data.

### The record remains pending after cloud recovery

Verify that the cloud API is reachable at the address configured in the gateway, review gateway logs, and inspect retry/queue status. Pending status during an outage may be expected; after recovery, verify the same request ID is synchronized.

## 10. GitHub and security checklist

Before pushing to a public repository, make sure it does not contain:

- API keys, access tokens, passwords, credentials, or private `.env` files
- private database content, logs, or test data
- temporary tunnel URLs that are being treated as permanent configuration
- virtual environments (`.venv/`, `venv/`), Python cache files, or frontend `node_modules/`

A `.gitignore` does not automatically remove files already tracked by Git. Review before committing:

```powershell
git status --short
git diff --cached --stat
```

If a real secret was committed, deleting it in a later commit is not enough to guarantee removal from Git history. Revoke or rotate the secret first.

## 11. Current scope and limitations

### Current repository scope

- FastAPI fog gateway and local SQLite-backed persistence/queue logic
- Separate local Cloud API implementation
- React/Vite frontend dashboard
- Python telemetry simulator
- Tinkercad Arduino Uno source and Python bridge files
- Wokwi ESP32 simulation files
- Unit tests for selected gateway and resilience components

### Limitations

- Telemetry may be simulated or derived; it should not be represented as measured physical sensor data unless actual hardware is connected and used.
- Tinkercad's Serial Monitor is not automatically a local Windows COM port. Only claim automatic serial ingestion if the bridge implements and verifies that transport.
- LocalTunnel URLs are temporary and intended for development/demo use, not permanent hosting.
- Reliability depends on the implementation and test conditions. Demonstrate retention, retries, and recovery with evidence rather than promising absolute reliability.
- This is an academic prototype, not a production or safety-critical deployment.

## License

No license has been selected in this repository yet. Until a license is added, do not assume that others have permission to reuse, modify, or redistribute the project's code.
