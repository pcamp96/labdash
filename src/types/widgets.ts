import { z } from 'zod';

// Widget type enum matching Prisma schema
export enum WidgetType {
  DOCKER_CONTAINER = 'DOCKER_CONTAINER',
  DOCKER_STATS = 'DOCKER_STATS',
  DOCKER_LIST = 'DOCKER_LIST',
  ARR_SERVICE = 'ARR_SERVICE',
  DOWNLOAD_CLIENT = 'DOWNLOAD_CLIENT',
  MEDIA_SERVER = 'MEDIA_SERVER',
  DNS_BLOCKER = 'DNS_BLOCKER',
  GRAFANA_PANEL = 'GRAFANA_PANEL',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH',
  CALENDAR = 'CALENDAR',
  RECENT_ACTIVITY = 'RECENT_ACTIVITY',
  CUSTOM_LINKS = 'CUSTOM_LINKS',
}

// Metrics that can be displayed in Docker Stats widget
export type DockerMetric = 'cpu' | 'memory' | 'network' | 'disk';

// Docker Stats Widget Configuration (Maximum Customizability)
export const dockerStatsWidgetConfigSchema = z.object({
  containerIds: z.array(z.string()).min(1).max(10), // Support 1-10 containers per widget
  refreshInterval: z.number().min(1000).max(60000).default(5000), // 1s to 60s, default 5s
  metrics: z.array(z.enum(['cpu', 'memory', 'network', 'disk'])).min(1).default(['cpu', 'memory']),
  chartType: z.enum(['line', 'area', 'bar']).default('line'),
  timeRange: z.number().min(60).max(3600).default(300), // 1min to 1hr of data, default 5min
  showLegend: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  thresholds: z.object({
    cpu: z.object({
      warning: z.number().min(0).max(100).default(70),
      critical: z.number().min(0).max(100).default(90),
    }).optional(),
    memory: z.object({
      warning: z.number().min(0).max(100).default(80),
      critical: z.number().min(0).max(100).default(95),
    }).optional(),
  }).optional(),
  colors: z.object({
    cpu: z.string().default('#3b82f6'),
    memory: z.string().default('#10b981'),
    network: z.string().default('#f59e0b'),
    disk: z.string().default('#8b5cf6'),
  }).optional(),
});

export type DockerStatsWidgetConfig = z.infer<typeof dockerStatsWidgetConfigSchema>;

// Docker Container Widget Configuration
export const dockerContainerWidgetConfigSchema = z.object({
  containerId: z.string(),
  showLogs: z.boolean().default(true),
  showStats: z.boolean().default(true),
  showPorts: z.boolean().default(true),
  logLines: z.number().min(10).max(1000).default(100),
  refreshInterval: z.number().min(1000).max(60000).default(5000),
});

export type DockerContainerWidgetConfig = z.infer<typeof dockerContainerWidgetConfigSchema>;

// Docker List Widget Configuration
export const dockerListWidgetConfigSchema = z.object({
  showAll: z.boolean().default(true), // Show stopped containers too
  sortBy: z.enum(['name', 'status', 'created', 'image']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filterByLabel: z.record(z.string()).optional(), // Filter by Docker labels
  refreshInterval: z.number().min(1000).max(60000).default(5000),
  showActions: z.boolean().default(true),
  compactView: z.boolean().default(false),
});

export type DockerListWidgetConfig = z.infer<typeof dockerListWidgetConfigSchema>;

// Grafana Panel Widget Configuration
export const grafanaPanelWidgetConfigSchema = z.object({
  dashboardUid: z.string(),
  panelId: z.number(),
  timeRange: z.object({
    from: z.string().default('now-6h'),
    to: z.string().default('now'),
  }).default({ from: 'now-6h', to: 'now' }),
  refreshInterval: z.number().min(5000).max(300000).default(30000), // 5s to 5min
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  kiosk: z.boolean().default(true), // Hide Grafana UI chrome
});

export type GrafanaPanelWidgetConfig = z.infer<typeof grafanaPanelWidgetConfigSchema>;

// Base widget definition
export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'docker' | 'media' | 'download' | 'infrastructure' | 'monitoring' | 'other';
  defaultSize: { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };
  configSchema: z.ZodSchema;
  component: React.ComponentType<WidgetProps<any>>;
}

// Widget component props
export interface WidgetProps<T = any> {
  id: string;
  config: T;
  onConfigChange?: (config: T) => void;
  isEditMode?: boolean;
}

// Grid layout item
export interface LayoutItem {
  i: string; // Widget ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean; // Can't be moved/resized
}

// Dashboard layout configuration
export interface DashboardLayout {
  lg: LayoutItem[]; // Large screens (1200px+)
  md: LayoutItem[]; // Medium screens (996px+)
  sm: LayoutItem[]; // Small screens (768px+)
  xs: LayoutItem[]; // Extra small screens (480px+)
  xxs: LayoutItem[]; // Tiny screens (<480px)
}
