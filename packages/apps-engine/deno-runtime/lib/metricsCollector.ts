import { writeAll } from '@std/io';
import { Queue } from './messenger.ts';

export function collectMetrics() {
	return {
		pid: Deno.pid,
		queueSize: Queue.getCurrentSize(),
	};
}

const encoder = new TextEncoder();

/**
 * Sends metrics collected from the system via stderr
 */
export async function sendMetrics() {
	const metrics = collectMetrics();

	await writeAll(Deno.stderr, encoder.encode(JSON.stringify(metrics)));
}
