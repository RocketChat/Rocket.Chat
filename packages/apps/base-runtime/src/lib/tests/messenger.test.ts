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

	describe('meta', () => {
		const meta = { traceId: 'trace-1' };

		it('should forward the meta of a success response', async () => {
			const theSpy = mock.method(Messenger.Queue, 'enqueue');

			await Messenger.successResponse({ id: 'test', result: 'test', meta }, context);

			const [responseArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((responseArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should forward the meta of an error response', async () => {
			const theSpy = mock.method(Messenger.Queue, 'enqueue');

			await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test' }, meta }, context);

			const [responseArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((responseArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should forward the meta of a notification', () => {
			const theSpy = mock.method(Messenger.Queue, 'enqueue');

			Messenger.sendNotification({ method: 'test', params: [], meta });

			const [notificationArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((notificationArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should forward the meta of a request', () => {
			const theSpy = mock.method(Messenger.Queue, 'enqueue');

			// The response never arrives here, so we only assert on what was enqueued.
			void Messenger.sendRequest({ method: 'test', params: [], meta });

			const [requestArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((requestArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should leave meta absent when the descriptor omits it', async () => {
			const theSpy = mock.method(Messenger.Queue, 'enqueue');

			await Messenger.successResponse({ id: 'test', result: 'test' }, context);

			const [responseArgument] = theSpy.mock.calls[0].arguments;

			assert.strictEqual('meta' in (responseArgument as any), false);

			theSpy.mock.restore();
		});
	});
});
