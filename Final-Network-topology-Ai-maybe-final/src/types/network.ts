import type { Edge } from '@xyflow/react';

export interface Device {
  id: string;
  type: string;
  data: {
    label: string;
    type: string;
    maxThroughput?: string;
    throughputUnit?: string;
    bandwidth?: string;
    bandwidthUnit?: string;
    deviceRole?: string;
    userCapacity?: string;
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface NetworkDiagram {
  nodes: import('@xyflow/react').Node[];
  edges: Edge[];
  projectName?: string;
  timestamp: string;
}

export const DEVICE_ROLES = ['Core', 'Distribution', 'Access'] as const;
export const BANDWIDTH_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps'] as const;
export const THROUGHPUT_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps'] as const;

export type DeviceRole = typeof DEVICE_ROLES[number];
export type BandwidthUnit = typeof BANDWIDTH_UNITS[number];
export type ThroughputUnit = typeof THROUGHPUT_UNITS[number];

export interface Project {
  id: number;
  name: string;
  description?: string;
  diagram_data?: string;
  owner_id: number;
  created_at: string;
  updated_at?: string;
  analysis_count?: number;
}