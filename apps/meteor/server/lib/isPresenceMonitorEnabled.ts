import { isRunningMs } from './isRunningMs';

const startMonitor =
	typeof process.env.DISABLE_PRESENCE_MONITOR === 'undefined' ||
	!['true', 'yes'].includes(String(process.env.DISABLE_PRESENCE_MONITOR).toLowerCase());

export function isPresenceMonitorEnabled(): boolean {
	return startMonitor && !isRunningMs();
}
