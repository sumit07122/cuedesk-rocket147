/**
 * CueDesk Application Monitoring & Telemetry
 * Tracks errors, failed logins, failed payments, API failures, and performance metrics.
 */

export interface MonitoringEvent {
  id: string;
  type: 'error' | 'failed_login' | 'failed_payment' | 'api_failure' | 'performance';
  message: string;
  timestamp: number;
  clubId?: string;
  userId?: string;
  details?: Record<string, any>;
  deviceInfo?: string;
}

const eventLogBuffer: MonitoringEvent[] = [];
const MAX_BUFFER_SIZE = 100;

export function getDeviceInfo(): string {
  if (typeof window === 'undefined' || !navigator) return 'Server/Unknown';
  const ua = navigator.userAgent;
  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  return `${ua} | Screen: ${screenRes}`;
}

export function trackMonitoringEvent(
  type: MonitoringEvent['type'],
  message: string,
  details?: Record<string, any>,
  clubId?: string,
  userId?: string
): MonitoringEvent {
  const event: MonitoringEvent = {
    id: `mon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    message,
    timestamp: Date.now(),
    clubId,
    userId,
    details,
    deviceInfo: getDeviceInfo(),
  };

  eventLogBuffer.unshift(event);
  if (eventLogBuffer.length > MAX_BUFFER_SIZE) {
    eventLogBuffer.pop();
  }

  // Console log in dev or structured log in production
  if (type === 'error' || type === 'failed_login' || type === 'failed_payment') {
    console.warn(`[CueDesk Monitoring - ${type.toUpperCase()}]: ${message}`, details);
  }

  return event;
}

export function getRecentMonitoringEvents(): MonitoringEvent[] {
  return [...eventLogBuffer];
}
