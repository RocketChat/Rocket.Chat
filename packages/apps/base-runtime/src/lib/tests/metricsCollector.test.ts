import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import * as Messenger from '../messenger';
import { collectMetrics, sendMetrics } from '../metricsCollector';

describe('metricsCollector', () => {
	it('collects the process pid', () => {
		assert.deepStrictEqual(collectMetrics(), { pid: process.pid });
	});

	it('sends metrics to the host as a jsonrpc notification', () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

		sendMetrics();

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [notification] = theSpy.mock.calls[0].arguments as any[];

		assert.strictEqual(notification.jsonrpc, '2.0');
		assert.strictEqual(notification.method, 'metrics');
		assert.deepStrictEqual(notification.params, [{ pid: process.pid }]);

		theSpy.mock.restore();
	});
});
