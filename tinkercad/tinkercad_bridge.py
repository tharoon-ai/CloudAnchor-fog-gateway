import sys
import json
import time
import requests

GATEWAY_URL = "http://127.0.0.1:8000/api/ingest"

def forward_json_line(line: str):
    line = line.strip()
    if not line:
        return
    try:
        # Extract JSON substring if serial line contains other characters
        start = line.find('{')
        end = line.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = line[start:end+1]
            payload = json.loads(json_str)
        else:
            payload = json.loads(line)

        req_id = payload.get("request_id")
        if not req_id:
            print("[BRIDGE ERROR] Payload missing required 'request_id'.")
            return

        print(f"[BRIDGE FORWARD] Preserving Authoritative {req_id} -> {GATEWAY_URL}")
        res = requests.post(GATEWAY_URL, json=payload, timeout=3.0)
        print(f"[GATEWAY RESPONSE] {res.status_code}: {res.json()}")
    except json.JSONDecodeError as e:
        print(f"[BRIDGE PARSE ERROR] Invalid JSON: {e}")
    except Exception as e:
        print(f"[BRIDGE ERROR] {e}")

def main():
    print("=" * 60)
    print("CloudAnchor — Tinkercad Serial Telemetry Bridge")
    print("Preserves Authoritative REQ-X from Arduino without modification")
    print("=" * 60)
    print("Paste Arduino Serial Monitor lines (or stream via pipe). Type 'exit' to quit.")
    print('Example: {"request_id":"REQ-1","device_id":"ARDUINO-001","temperature":25.5,"humidity":56.4,"voltage":5.02}')
    print("=" * 60)

    while True:
        try:
            line = input("Arduino Serial > ")
            if line.strip().lower() in ["exit", "quit"]:
                break
            forward_json_line(line)
        except (KeyboardInterrupt, EOFError):
            break

if __name__ == '__main__':
    main()
