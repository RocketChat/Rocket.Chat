// A worker thread that runs a share of the viewers of a run, so parsing on the load generator does not delay receipt.
import { parentPort, workerData } from 'node:worker_threads';

import { adapters } from './adapters/index.mjs';
import { pool } from './lib/pool.mjs';
import { Viewer } from './lib/viewer.mjs';

const { specs, adapter, connectConcurrency } = workerData;
const viewers = specs.map((spec) => new Viewer(spec, adapters[adapter]));
const byIndex = new Map(viewers.map((viewer) => [viewer.spec.index, viewer]));

let failed = 0;
await pool(viewers, connectConcurrency, async (viewer) => {
	try {
		await viewer.start();
	} catch (err) {
		failed++;
		viewer.stats.errors++;
		viewer.lastError = String(err?.message ?? err);
	}
});
parentPort.postMessage({ type: 'ready', failed });

parentPort.on('message', async (msg) => {
	switch (msg.cmd) {
		case 'go':
			viewers.forEach((viewer) => viewer.startRecording());
			break;
		case 'reconnect':
			await Promise.all(msg.indexes.map((index) => byIndex.get(index)?.reconnect()));
			break;
		case 'progress':
			parentPort.postMessage({ type: 'progress', ended: viewers.filter((viewer) => viewer.ended).length });
			break;
		case 'finish': {
			viewers.forEach((viewer) => viewer.close());
			const latencies = Float64Array.from(viewers.flatMap((viewer) => viewer.latencies));
			parentPort.postMessage({ type: 'result', viewers: viewers.map((viewer) => viewer.result()), latencies }, [latencies.buffer]);
			break;
		}
	}
});
