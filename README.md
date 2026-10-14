# CloudAnchor: A Fog-Assisted Resilient Gateway for Intermittent Cloud APIs

CloudAnchor is an academic software prototype that demonstrates how a local **fog gateway** can accept telemetry, retain it in a local SQLite database when a cloud API is unavailable, and attempt synchronization after the cloud service becomes available again.

The current demonstration uses **simulated inputs**, a Python telemetry-entry bridge, a FastAPI gateway, and a temporary HTTPS tunnel. It is intended for development and demonstration—not for production or safety-critical deployment.

> **Current implementation note:** This README describes the current workflow discussed for the project: Tinkercad Arduino Uno with three potentiometers, a Python Tkinter bridge, LocalTunnel, and a FastAPI gateway. Some commands below assume the project root is `C:\cloud_final` and the gateway entry point is `backend.main:app`. If your actual folder/module names differ, adjust the command to match your files. Optional components are clearly marked.

---

## Contents

1. [What CloudAnchor Demonstrates](#1-what-cloudanchor-demonstrates)
2. [Current Architecture](#2-current-architecture)
3. [Telemetry Inputs and Calculations](#3-telemetry-inputs-and-calculations)
4. [Project Requirements](#4-project-requirements)
5. [Initial Setup](#5-initial-setup)
6. [Run the Project in Separate Terminals](#6-run-the-project-in-separate-terminals)
7. [Verify the Services](#7-verify-the-services)
8. [Demonstrate Cloud Failure and Recovery](#8-demonstrate-cloud-failure-and-recovery)
9. [Request IDs and Session Behaviour](#9-request-ids-and-session-behaviour)
10. [Troubleshooting](#10-troubleshooting)
11. [Repository and Security Checklist](#11-repository-and-security-checklist)
12. [Current Scope and Future Work](#12-current-scope-and-future-work)

---

## 1. What CloudAnchor Demonstrates

Cloud APIs and internet connections may become temporarily unavailable. If an application only forwards data directly to the cloud, a failed request may not be delivered. CloudAnchor places a local gateway between the telemetry producer and the cloud API.

The intended workflow is:

1. Prepare a telemetry record using simulated readings.
2. Submit the record to the FastAPI fog gateway.
3. Validate the request and retain the accepted record in local SQLite storage.
4. Forward or synchronize the record to the configured cloud API when the cloud endpoint is reachable.
5. If the cloud API is unavailable, retain the record as pending and retry according to the implementation's configured recovery logic.
6. After the cloud API is restored, verify that the **same request ID** is synchronized.

The core idea is **reliable local retention and later synchronization**, not the use of any one sensor or the display of animated dashboard events.

## 2. Current Architecture

```text
Tinkercad Arduino Uno
(3 potentiometers used as simulated inputs)
           |
           | Read the simulated values in Tinkercad
           v
Python Tkinter Telemetry Bridge
(manual entry in the current workflow)
           |
           | HTTPS POST to /api/ingest
           v
LocalTunnel HTTPS URL
           |
           v
FastAPI Fog Gateway — port 8000
           |
           +----> SQLite local storage / pending queue
           |
           +----> Retry / synchronization logic
                         |
                         v
              Cloud API — optionally port 8001
                         |
                         v
              Cloud-side storage, if configured

Optional web dashboard:
Frontend development server, commonly port 5173
```

### Important distinction about Tinkercad

The current Tkinter bridge does **not** directly read Tinkercad's Serial Monitor as a local Windows COM port. In this version, readings are entered into the bridge GUI manually, and the Python bridge generates the request IDs. Do not describe this as a fully automatic serial connection from Tinkercad to Python.

### Component summary

| Component | Role | Typical location or endpoint |
|---|---|---|
| Tinkercad simulation | Provides simulated analog inputs | Arduino Uno with potentiometers on A0, A1, and A2 |
| Python Tkinter bridge | Collects values, derives selected fields, creates a request ID, and submits telemetry | `serial-bridge/bridge.py` |
| LocalTunnel | Exposes the local gateway through a temporary HTTPS URL | `https://<current-subdomain>.loca.lt` |
| FastAPI fog gateway | Receives and processes telemetry | `http://127.0.0.1:8000`; `POST /api/ingest` |
| SQLite | Stores local telemetry/queue state according to the backend implementation | Database path is determined by backend configuration |
| Cloud API | Destination for synchronization when configured and available | Often `http://127.0.0.1:8001` in the local demonstration |
| Frontend dashboard (optional) | Displays backend state and telemetry | Development URL printed by the frontend command; commonly port 5173 |

## 3. Telemetry Inputs and Calculations

The current demonstration uses three potentiometers connected to an Arduino Uno in Tinkercad.

| Field | Input or calculation | Meaning |
|---|---|---|
| Temperature | Potentiometer on A0 mapped to roughly 15–50 °C | Simulated temperature; not a DHT22 measurement |
| Humidity | Potentiometer on A1 mapped to roughly 20–90% | Simulated humidity; not a physical humidity-sensor measurement |
| Voltage | Potentiometer on A2 mapped to roughly 3–12 V | Simulated voltage; not an INA219 measurement |
| Current | Derived in the Python bridge from the configured simulated relationship | Estimated/demo value, not a measured current-sensor reading |
| Power | Calculated using voltage and current | `Power (W) = Voltage (V) × Current (mA) / 1000` |
| Health score, status, and risk | Derived using the rules implemented in the bridge and/or gateway | Calculated indicators, not direct sensor measurements |

The exact conversion ranges and formulas should match the code currently committed to the repository. If those change, update this table as well.

## 4. Project Requirements

Install the following on the development computer:

- **Windows 10/11** or another OS supported by the project scripts.
- **Python 3** available through the `python` command.
- **pip**, normally installed with Python.
- **Node.js and npm** for running LocalTunnel through `npx` and for the optional frontend.
- **A web browser** for the FastAPI documentation and optional dashboard.
- **Internet access** while using LocalTunnel and any remote cloud API.
- **Tinkercad account/browser access** to run the Arduino Uno simulation.

Check the installed tools in PowerShell:

```powershell
python --version
python -m pip --version
node --version
npm --version
```

If a command is not recognized, install that tool and reopen PowerShell before continuing.

## 5. Initial Setup

### Step 5.1 — Open the project folder

Open PowerShell and move to the project root. The examples in this README assume the folder is `C:\cloud_final`:

```powershell
cd C:\cloud_final
```

If your project is in a different directory, use that directory instead. Confirm that you are at the project root:

```powershell
Get-Location
Get-ChildItem
```

You should see the project files and folders, such as `backend`, `serial-bridge`, and—if included—`cloud_api` and `frontend`.

### Step 5.2 — Create and activate a Python virtual environment

Run these commands from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run the following **in that PowerShell window**, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Activation is normally shown by `(.venv)` at the start of the prompt. This changes the current terminal only.

### Step 5.3 — Install Python dependencies

If `requirements.txt` exists in the project root, run:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If there is no `requirements.txt`, do not assume this command will work. Check the repository's dependency file or project imports and install the dependencies documented by the project.

### Step 5.4 — Install frontend dependencies (optional)

Only do this if the project contains a `frontend` folder with a `package.json` file:

```powershell
cd C:\cloud_final\frontend
npm install
cd C:\cloud_final
```

Do this once during initial setup, and repeat `npm install` if the frontend dependency list changes.

---

## 6. Run the Project in Separate Terminals

**Keep each service in its own terminal window.** Do not close a terminal while you still need the service it runs. Start the optional Cloud API first if your gateway is configured to forward records to it.

### Terminal 1 — Cloud API (optional local destination)

Use this terminal only if the repository contains `cloud_api/main.py` and the gateway is configured to synchronize to that local API. The command assumes the FastAPI application variable is named `app` in that file.

```powershell
cd C:\cloud_final
.\.venv\Scripts\Activate.ps1
python -m uvicorn cloud_api.main:app --host 127.0.0.1 --port 8001
```

Keep the terminal open. If it starts correctly, Uvicorn will report that it is running on port `8001`.

Open this address in a browser if that service is running:

`http://127.0.0.1:8001/docs`

**Skip this terminal** if your current project does not contain a separate `cloud_api` application or if the backend is configured to use a different remote cloud endpoint. Do not create or assume a cloud API that is not in your codebase.

### Terminal 2 — FastAPI Fog Gateway

Open a **new PowerShell window**. Run:

```powershell
cd C:\cloud_final
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

This command assumes that `backend/main.py` exposes a FastAPI object named `app`. If the module path or application variable differs in your repository, use the matching path instead.

Keep this terminal open. The gateway should report that it is running on port `8000`.

Open the gateway API documentation:

`http://127.0.0.1:8000/docs`

Confirm that the documentation page loads before moving to the next step. The project bridge submits telemetry to the gateway's `POST /api/ingest` endpoint.

### Terminal 3 — LocalTunnel

Open another **new PowerShell window**. Run:

```powershell
npx localtunnel --port 8000
```

If prompted, allow `npx` to download/run LocalTunnel. When it starts, it will print a public HTTPS URL similar to:

```text
https://some-generated-name.loca.lt
```

Copy the **current URL exactly** and keep this terminal open. The URL is temporary and may change whenever LocalTunnel is restarted.

**Do not add `:8000` to the public URL.** LocalTunnel already forwards the HTTPS URL to your local port 8000.

### Terminal 4 — Python Tkinter Telemetry Bridge

Before starting the bridge, update its URL to match the current LocalTunnel URL.

1. Open `serial-bridge/bridge.py` in VS Code or another text editor.
2. Find the `GATEWAY_URL` setting.
3. Replace its value with your current LocalTunnel URL plus `/api/ingest`.

Example only:

```python
GATEWAY_URL = "https://YOUR-CURRENT-SUBDOMAIN.loca.lt/api/ingest"
```

Replace `YOUR-CURRENT-SUBDOMAIN` with the exact URL printed in Terminal 3. Do not leave the placeholder text in your code.

Then open another **new PowerShell window** and run:

```powershell
cd C:\cloud_final\serial-bridge
python bridge.py
```

A Tkinter window should open. Enter or adjust the simulated values and click the bridge's **Send Telemetry** button. The current bridge workflow creates the next visible request ID when you submit a record, for example `REQ-1`, `REQ-2`, and `REQ-3`.

Keep the bridge window open while submitting records. If the bridge shows a gateway connection error, check the gateway, LocalTunnel URL, and `GATEWAY_URL` setting using the troubleshooting section.

> **Reminder:** If LocalTunnel restarts and prints a different URL, update `GATEWAY_URL` in `bridge.py` and restart the bridge. Automatic tunnel URL detection is not part of this manual configuration unless you separately implement it.

### Terminal 5 — Frontend Dashboard (optional)

Use this terminal only if your repository includes a React/Vite or similar frontend in the `frontend` folder with a valid `package.json`.

```powershell
cd C:\cloud_final\frontend
npm run dev
```

If the dependencies have not yet been installed, run `npm install` once in this folder and then run `npm run dev` again.

The terminal prints the local dashboard URL. For a Vite configuration this is commonly:

`http://localhost:5173`

Open the **URL actually printed by the command**. Leave Terminal 5 open while using the dashboard. If the dashboard loads but does not show current telemetry, verify its configured backend API URL and confirm the backend returns real stored data; do not use fake events to make the dashboard appear active.

### Startup checklist

Before submitting telemetry, check that:

- [ ] The optional Cloud API is running, if your gateway uses it.
- [ ] The Fog Gateway is running on port `8000`.
- [ ] `http://127.0.0.1:8000/docs` opens.
- [ ] LocalTunnel is running and its current URL is copied.
- [ ] `GATEWAY_URL` in `serial-bridge/bridge.py` contains that URL followed by `/api/ingest`.
- [ ] The Python Tkinter bridge opens without an exception.
- [ ] The frontend is running, if you are using it.

---

## 7. Verify the Services

### Check the local gateway

Open:

`http://127.0.0.1:8000/docs`

If this page does not load, the gateway may not be running, the port may be different, or Uvicorn may have failed during startup. Read the full error shown in Terminal 2.

### Check the public tunnel route

Replace the example URL with the current URL printed in Terminal 3 and open:

```text
https://YOUR-CURRENT-SUBDOMAIN.loca.lt/docs
```

If the tunnel page cannot reach the gateway, confirm that Terminal 2 is still running and that LocalTunnel is forwarding port `8000`.

### Submit one telemetry record

1. Open the Tkinter bridge.
2. Enter the test values.
3. Click **Send Telemetry** once.
4. Note the request ID and the response shown by the bridge.
5. Check the gateway terminal and API/database state for that same record.

A response from the bridge shows the result of that HTTP request; it does not by itself prove that the cloud has synchronized the record. Verify the backend's queue status, logs, or cloud-side record as well.

### Optional API request test

The exact request body accepted by `/api/ingest` is defined by your backend's request model. Use the schema shown in `http://127.0.0.1:8000/docs` rather than relying on an example payload that may not match the current code. For the primary demonstration, using the Tkinter bridge avoids accidentally sending a payload with missing required fields.

---

## 8. Demonstrate Cloud Failure and Recovery

The purpose of this test is to show the **cloud destination becoming unavailable while the local Fog Gateway remains reachable**. Do not stop the gateway or LocalTunnel for this test: if the bridge cannot reach the gateway, the record may never reach SQLite.

### A. Normal operation

1. Start the Cloud API (if configured), Fog Gateway, LocalTunnel, and Tkinter bridge using the terminals above.
2. Submit one record from the bridge.
3. Note its request ID.
4. Verify whether the backend reports it as accepted and whether cloud synchronization succeeds.
5. Check that the pending queue count/status matches the actual backend state, if the dashboard exposes it.

### B. Simulate the cloud API becoming unavailable

If you use the local Cloud API in Terminal 1:

1. Keep Terminal 2 (Fog Gateway) and Terminal 3 (LocalTunnel) running.
2. In **Terminal 1 only**, press `Ctrl+C` to stop the Cloud API.
3. Submit a new record from the Tkinter bridge and note its request ID.
4. Check the gateway response, SQLite queue state, and gateway logs to determine whether the record was retained as pending.

If your gateway is configured to use a remote cloud service instead, use that service's safe test/outage method. Do not disrupt a real production service for a demonstration.

### C. Restore the cloud API

If using the local Cloud API, restart it in Terminal 1 with the same command:

```powershell
cd C:\cloud_final
.\.venv\Scripts\Activate.ps1
python -m uvicorn cloud_api.main:app --host 127.0.0.1 --port 8001
```

Then verify in backend logs/database or the cloud-side API that the pending record is retried and synchronized. Look for the **same request ID** submitted during the outage. A reliable demonstration should verify the status change and confirm that the record is not duplicated.

**Do not claim “zero data loss” simply because a dashboard turns green.** Confirm it from the local queue, gateway logs, or cloud-side data. Results depend on the implementation and the test performed.

---

## 9. Request IDs and Session Behaviour

In the current manual Tkinter workflow:

- The bridge creates visible request IDs such as `REQ-1`, `REQ-2`, and `REQ-3` when the user submits telemetry.
- The counter currently resets when the bridge process is restarted.
- This workflow does not directly obtain the request ID from Tinkercad's Serial Monitor.
- If IDs restart for a new session, the backend should use its internal record ID and/or a session identifier to distinguish records in storage while preserving the visible request ID.
- When testing recovery, compare the original request ID before and after synchronization to verify that the same record was retained.

Avoid manually changing an ID midway through a test. If a test requires unique IDs across bridge restarts, implement and test a persistent counter or session ID rather than assuming the current in-memory counter is persistent.

---

## 10. Troubleshooting

### Problem: `ModuleNotFoundError` or a package is missing

Activate the intended virtual environment and install the project's declared dependencies:

```powershell
cd C:\cloud_final
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Run the command only if `requirements.txt` exists. Check that the same Python environment is used to install dependencies and run Uvicorn or `bridge.py`.

### Problem: `Error loading ASGI app` or `Could not import module`

The command's module path may not match the repository. Confirm that `backend\main.py` exists and exposes the FastAPI object named `app`. If the file or variable has a different name, update the Uvicorn target accordingly.

### Problem: Port 8000 is already in use

In PowerShell, check which process is listening:

```powershell
netstat -ano | findstr :8000
```

The last column is the PID. Inspect it before taking action:

```powershell
tasklist /FI "PID eq YOUR_PID_HERE"
```

Only stop that process if you have confirmed it belongs to an old CloudAnchor server that you intend to stop. Replace `YOUR_PID_HERE` with the actual number. Do not terminate unknown processes.

### Problem: The bridge displays `GATEWAY CONNECTION ERROR`

Check these in order:

1. Is Terminal 2 still running without a traceback?
2. Does `http://127.0.0.1:8000/docs` open locally?
3. Is Terminal 3 still running?
4. Did you copy the **latest** LocalTunnel URL?
5. Does `GATEWAY_URL` end with `/api/ingest` exactly once?
6. Is the URL using `https://` and does it omit `:8000`?
7. Did the LocalTunnel URL change after a restart?

### Problem: LocalTunnel works in the browser but the bridge fails

Check the complete response or exception shown in the bridge terminal/window. Verify that the gateway endpoint accepts `POST /api/ingest` and that the current bridge payload matches the backend's expected request schema. A browser opening `/docs` confirms that the route can reach the gateway; it does not automatically verify that every POST request is valid.

### Problem: The request is accepted, but cloud status remains offline or the record stays pending

Confirm that the configured cloud API is running and reachable at the address used in the gateway configuration. If the cloud API runs locally, verify its port and open its `/docs` page. Check gateway logs for connection errors and verify that its retry logic is active. A record remaining pending may be the expected behavior during an outage; after recovery, verify the same request ID becomes synchronized.

### Problem: Dashboard does not show the new record

Confirm the backend accepted the record and inspect the dashboard's API base URL. Ensure the frontend is reading from the actual gateway/database endpoints, rather than a static sample dataset. Check both the browser developer console and frontend terminal for API errors.

### Problem: Tinkercad values are not automatically appearing in the bridge

That is expected in the current manual-entry setup: Python is not reading Tinkercad's Serial Monitor directly. Enter the values in the Tkinter GUI. Automatic serial ingestion would require a different bridge/transport path and should be documented only after it is implemented and tested.

---

## 11. Repository and Security Checklist

Before pushing the project to a public GitHub repository, inspect the files being committed. Avoid publishing:

- API keys, tokens, passwords, credentials, or private `.env` files.
- Python virtual environments such as `.venv/` and `venv/`.
- `__pycache__/`, `*.pyc`, and temporary build files.
- Frontend `node_modules/` and generated build output unless intentionally required.
- Local SQLite databases (`*.db`, `*.sqlite`, `*.sqlite3`) if they contain private data, test history, or machine-specific paths.
- Logs, local-only configuration, temporary URLs, or private records.

A Python `.gitignore` is useful, but it will not automatically remove files already tracked by Git. Review the staged changes before committing:

```powershell
git status --short
git diff --cached --stat
```

If a secret was committed, removing it in a later commit does not guarantee that it is gone from the repository history. Revoke or rotate the exposed credential, then clean up the repository history if necessary.

## 12. Current Scope and Future Work

### Current scope

- Simulated analog inputs using Tinkercad Arduino Uno and potentiometers.
- Manual telemetry submission through a Python Tkinter GUI.
- Request ID generation by the bridge in the current workflow.
- FastAPI ingestion at `/api/ingest`.
- SQLite-based local retention and pending-queue workflow, as implemented by the backend.
- Cloud synchronization/retry behavior when a cloud endpoint is configured.
- Optional frontend dashboard if included in the project checkout.

### Limitations

- Values are simulated or derived; the current demo does not establish physical measurement accuracy.
- The manual bridge is not a direct Tinkercad Serial Monitor connection.
- LocalTunnel URLs are temporary and are intended for development/demo use, not permanent production hosting.
- Data retention and recovery should be demonstrated with repeatable failure-and-recovery tests. Avoid promising absolute or 100% reliability without evidence from those tests.
- The project is an academic prototype and is not intended for safety-critical or production deployment.

### Possible future improvements

- Automatically discover the current LocalTunnel URL and pass it to the bridge.
- Add a tested serial, MQTT, or other transport adapter for automatic telemetry ingestion.
- Add persistent request/session identifiers across bridge restarts.
- Expand automated tests for database persistence, gateway restarts, retry behavior, and duplicate prevention.
- Add authentication, authorization, and secure deployment configuration before exposing the gateway beyond a controlled demo.

## License

No license has been selected for this repository yet. Until a license is added, do not assume that others have permission to reuse, modify, or redistribute the project's code.
