/**
 * Standalone driver for a manual latency sniff (decision 0005 §6) — not part of the acceptance
 * gate. Boots one worker and times `load` and dispatch round-trips. Run with `yarn driver`.
 */
import { performance } from 'node:perf_hooks';

import { makeAppTgz } from './__tests__/make-tgz';
import { AppWorker } from './host';

const BUNDLE = `
const { defineApp } = require('@rocket.chat/apps-sdk');
module.exports.default = defineApp((app) => {
  app.on('message:send:pre', (event) =>
    event.message.text.includes('spam') ? event.prevent({ i18n: 'spam_blocked' }) : event.continue,
  );
});
`;

async function main(): Promise<void> {
	const packagePath = await makeAppTgz(BUNDLE, 'driver-app');
	const worker = new AppWorker({ packagePath });

	const t0 = performance.now();
	const { registrations } = await worker.load();
	console.log(`load: ${(performance.now() - t0).toFixed(1)}ms`, registrations);

	const payload = (text: string) => ({ message: { id: 'm', rid: 'r', text } });
	await worker.dispatch('message:send:pre', payload('warmup'));

	const n = 1000;
	const start = performance.now();
	for (let i = 0; i < n; i++) {
		await worker.dispatch('message:send:pre', payload(i % 2 === 0 ? 'spam' : 'hi'));
	}
	const total = performance.now() - start;
	console.log(`dispatch x${n}: ${total.toFixed(1)}ms total, ${(total / n).toFixed(3)}ms/round-trip`);

	console.log('sample:', await worker.dispatch('message:send:pre', payload('spam')));
	await worker.terminate();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
