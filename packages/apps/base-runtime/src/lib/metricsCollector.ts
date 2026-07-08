import * as Messenger from './messenger';

export function collectMetrics() {
	return {
		pid: process.pid,
	};
}

/**
 * Sends metrics collected from the system to the host over the IPC channel
 */
export function sendMetrics(): void {
	Messenger.sendNotification({ method: 'metrics', params: [collectMetrics()] });
}
