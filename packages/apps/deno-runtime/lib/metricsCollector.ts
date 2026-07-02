import { Queue } from './messenger.ts';

export function collectMetrics() {
	return {
		pid: Deno.pid,
		queueSize: Queue.getCurrentSize(),
	};
}

const encoder = new TextEncoder();

async function writeAll(writer: Deno.Writer, data: Uint8Array): Promise<void> {
	let written = 0;

	while (written < data.length) {
		written += await writer.write(data.subarray(written));
	}
}

/**
 * Sends metrics collected from the system via stderr
 */
export async function sendMetrics() {
	const metrics = collectMetrics();

	await writeAll(Deno.stderr, encoder.encode(JSON.stringify(metrics)));
}
