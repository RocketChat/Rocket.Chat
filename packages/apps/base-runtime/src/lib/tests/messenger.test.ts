import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { createMockRequest } from '../../handlers/tests/helpers/mod';
import * as Messenger from '../messenger';
import type { RequestContext } from '../requestContext';

describe('Messenger', () => {
	let context: RequestContext;

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'test');
		Messenger.setTransport(Messenger.noopTransport);

		context = createMockRequest({ method: 'test', params: [] });
	});

	after(() => {
		AppObjectRegistry.clear();
		Messenger.setTransport(Messenger.noopTransport);
	});

	it('should add logs to success responses', async () => {
		const theSpy = mock.method(Messenger.Queue, 'enqueue');
		const { logger } = context.context;

		logger.info('test');

		await Messenger.successResponse({ id: 'test', result: 'test' }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.jsonrpc, '2.0');
		assert.strictEqual(resp.id, 'test');
		assert.strictEqual(resp.result.value, 'test');
		assert.strictEqual(resp.result.logs.appId, 'test');
		assert.strictEqual(resp.result.logs.method, 'test');
		assert.strictEqual(resp.result.logs.entries.length, 1);
		assert.strictEqual(resp.result.logs.entries[0].severity, 'info');
		assert.strictEqual(resp.result.logs.entries[0].method, 'test');
		assert.deepStrictEqual(resp.result.logs.entries[0].args, ['test']);
		assert.strictEqual(resp.result.logs.entries[0].caller, 'anonymous OR constructor');

		theSpy.mock.restore();
	});

	it('should add logs to error responses', async () => {
		const theSpy = mock.method(Messenger.Queue, 'enqueue');
		const { logger } = context.context;

		logger.info('test');

		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test' } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.jsonrpc, '2.0');
		assert.strictEqual(resp.id, 'test');
		assert.strictEqual(resp.error.code, -32000);
		assert.strictEqual(resp.error.message, 'test');
		assert.strictEqual(resp.error.data.logs.appId, 'test');
		assert.strictEqual(resp.error.data.logs.method, 'test');
		assert.strictEqual(resp.error.data.logs.entries.length, 1);
		assert.strictEqual(resp.error.data.logs.entries[0].severity, 'info');
		assert.strictEqual(resp.error.data.logs.entries[0].method, 'test');
		assert.deepStrictEqual(resp.error.data.logs.entries[0].args, ['test']);
		assert.strictEqual(resp.error.data.logs.entries[0].caller, 'anonymous OR constructor');

		theSpy.mock.restore();
	});
});
