import { Queue } from './messenger';

export function collectMetrics() {
	return {
		pid: process.pid,
		queueSize: Queue.getCurrentSize(),
	};
}

const encoder = new TextEncoder();

/**
 * Sends metrics collected from the system via stderr
 */
export async function sendMetrics() {
	const metrics = collectMetrics();

	await new Promise<void>((resolve, reject) => {
		process.stderr.write(encoder.encode(JSON.stringify(metrics)), (err) => (err ? reject(err) : resolve()));
	});
}
