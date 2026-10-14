import type { DashboardMetrics, LogEntry, ResilienceConfig } from '../types/dashboard';

export type SystemMetrics = DashboardMetrics;
export type TechnicalLog = LogEntry;

const GATEWAY_API_BASE = 'http://localhost:8000/api';

export interface SensorIngestPayload {
  request_id: string;
  device_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  acceleration_x?: number;
  acceleration_y?: number;
  acceleration_z?: number;
  vibration_level?: number;
  voltage?: number;
  current?: number;
  power?: number;
  gas_level?: number;
  pressure?: number;
}

export const fetchMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch(`${GATEWAY_API_BASE}/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }
  return response.json();
};

export const fetchLogs = async (): Promise<LogEntry[]> => {
  const response = await fetch(`${GATEWAY_API_BASE}/logs`);
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }
  return response.json();
};

export const fetchResilienceConfig = async (): Promise<ResilienceConfig> => {
  const response = await fetch(`${GATEWAY_API_BASE}/resilience/config`);
  if (!response.ok) {
    throw new Error(`Failed to fetch resilience config: ${response.statusText}`);
  }
  return response.json();
};

export const updateResilienceConfig = async (config: Partial<ResilienceConfig>): Promise<void> => {
  const response = await fetch(`${GATEWAY_API_BASE}/resilience/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error(`Failed to update resilience config: ${response.statusText}`);
  }
};

export const setCloudStatus = async (status: 'ONLINE' | 'OFFLINE'): Promise<void> => {
  const response = await fetch(`${GATEWAY_API_BASE}/resilience/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update cloud status: ${response.statusText}`);
  }
};

export const ingestData = async (payload: SensorIngestPayload): Promise<any> => {
  const response = await fetch(`${GATEWAY_API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok && response.status !== 400 && response.status !== 503) {
    throw new Error(`Ingestion failed with status: ${response.status}`);
  }
  return response.json();
};

export const fetchLatestFusion = async (): Promise<any> => {
  const response = await fetch(`${GATEWAY_API_BASE}/fusion/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch fusion data: ${response.statusText}`);
  }
  return response.json();
};

export const ingestTelemetry = ingestData;

export const api = {
  getMetrics: fetchMetrics,
  getLogs: fetchLogs,
  getResilienceConfig: fetchResilienceConfig,
  updateResilienceConfig,
  controlResilience: setCloudStatus,
  ingestData,
  ingestTelemetry,
  fetchLatestFusion
};

