import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';
import * as v8 from 'node:v8';

import { sanitizeForIpc } from '@rocket.chat/apps/dist/lib/IpcSanitizer';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { createMockRequest } from '../../handlers/tests/helpers/mod';
import * as Messenger from '../messenger';
import type { RequestContext } from '../requestContext';

describe('Messenger', () => {
	let context: RequestContext;

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'test');

		context = createMockRequest({ method: 'test', params: [] });
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('should add logs to success responses', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
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
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
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

	it('should leave error.data absent when no logs and no data are supplied', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test' } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual('data' in resp.error, false);

		theSpy.mock.restore();
	});

	it('should preserve original error.data when no logs exist', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: { custom: 'value' } } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.deepStrictEqual(resp.error.data, { custom: 'value' });

		theSpy.mock.restore();
	});

	it('should not mutate original error.data object when adding logs', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		const originalData = { originalKey: 'originalValue' };
		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: originalData } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.error.data.originalKey, 'originalValue');
		assert.strictEqual(resp.error.data.logs.appId, 'test');
		assert.strictEqual('logs' in originalData, false);
		assert.notStrictEqual(resp.error.data, originalData);

		theSpy.mock.restore();
	});

	it('should handle frozen error.data objects without throwing', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		const frozenData = Object.freeze({ frozenKey: 'frozenValue' });
		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: frozenData } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.error.data.frozenKey, 'frozenValue');
		assert.strictEqual(resp.error.data.logs.appId, 'test');

		theSpy.mock.restore();
	});

	it('should wrap primitive error.data values and attach logs without throwing', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: 'primitive error details' } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.error.data.value, 'primitive error details');
		assert.strictEqual(resp.error.data.logs.appId, 'test');

		theSpy.mock.restore();
	});

	it('should handle null error.data when adding logs without throwing', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: null } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.error.data.value, null);
		assert.strictEqual(resp.error.data.logs.appId, 'test');

		theSpy.mock.restore();
	});

	it('should wrap array error.data so logs are not lost', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		const arrayData = ['err1', 'err2'];
		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: arrayData } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.deepStrictEqual(resp.error.data.value, ['err1', 'err2']);
		assert.strictEqual(resp.error.data.logs.appId, 'test');

		theSpy.mock.restore();
	});

	it('should preserve Error instances as value alongside logs without dropping message or stack', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		const errorInstance = new Error('custom error message');
		errorInstance.cause = new Error('inner cause');
		await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test', data: errorInstance } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 1);

		const [responseArgument] = theSpy.mock.calls[0].arguments;
		const resp = responseArgument as any;

		assert.strictEqual(resp.error.data.value, errorInstance);

		const sanitized = sanitizeForIpc(resp);
		const cloned = v8.deserialize(v8.serialize(sanitized)) as any;

		assert.ok(cloned.error.data.value instanceof Error);
		assert.strictEqual(cloned.error.data.value.message, 'custom error message');
		assert.strictEqual(cloned.error.data.value.stack, errorInstance.stack);
		assert.ok(cloned.error.data.value.cause instanceof Error);
		assert.strictEqual((cloned.error.data.value.cause as Error).message, 'inner cause');
		assert.strictEqual(cloned.error.data.logs.appId, 'test');

		theSpy.mock.restore();
	});

	it('should wrap non-plain error.data objects as value and preserve them through IPC serialization alongside logs', async () => {
		const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());
		const { logger } = context.context;
		logger.info('test');

		const date = new Date('2026-01-01T00:00:00.000Z');
		await Messenger.errorResponse({ id: 'test-date', error: { code: -32000, message: 'test', data: date } }, context);

		const map = new Map([['key', 'val']]);
		await Messenger.errorResponse({ id: 'test-map', error: { code: -32000, message: 'test', data: map } }, context);

		assert.strictEqual(theSpy.mock.calls.length, 2);

		const [dateCall, mapCall] = theSpy.mock.calls;
		const respDate = dateCall.arguments[0] as any;
		const respMap = mapCall.arguments[0] as any;

		assert.strictEqual(respDate.error.data.value, date);
		assert.strictEqual(respDate.error.data.logs.appId, 'test');

		const clonedDate = v8.deserialize(v8.serialize(sanitizeForIpc(respDate))) as any;
		assert.ok(clonedDate.error.data.value instanceof Date);
		assert.strictEqual(clonedDate.error.data.value.toISOString(), date.toISOString());
		assert.strictEqual(clonedDate.error.data.logs.appId, 'test');

		assert.strictEqual(respMap.error.data.value, map);
		assert.strictEqual(respMap.error.data.logs.appId, 'test');

		const clonedMap = v8.deserialize(v8.serialize(sanitizeForIpc(respMap))) as any;
		assert.ok(clonedMap.error.data.value instanceof Map);
		assert.strictEqual(clonedMap.error.data.value.get('key'), 'val');
		assert.strictEqual(clonedMap.error.data.logs.appId, 'test');

		theSpy.mock.restore();
	});

	describe('meta', () => {
		const meta = { traceId: 'trace-1' };

		it('should forward the meta of a success response', async () => {
			const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

			await Messenger.successResponse({ id: 'test', result: 'test', meta }, context);

			const [responseArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((responseArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should forward the meta of an error response', async () => {
			const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

			await Messenger.errorResponse({ id: 'test', error: { code: -32000, message: 'test' }, meta }, context);

			const [responseArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((responseArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should forward the meta of a notification', () => {
			const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

			Messenger.sendNotification({ method: 'test', params: [], meta });

			const [notificationArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((notificationArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should forward the meta of a request', () => {
			const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

			// The response never arrives here, so we only assert on what was enqueued.
			void Messenger.sendRequest({ method: 'test', params: [], meta });

			const [requestArgument] = theSpy.mock.calls[0].arguments;

			assert.deepStrictEqual((requestArgument as any).meta, meta);

			theSpy.mock.restore();
		});

		it('should leave meta absent when the descriptor omits it', async () => {
			const theSpy = mock.method(Messenger.ipcChannel, 'send', () => Promise.resolve());

			await Messenger.successResponse({ id: 'test', result: 'test' }, context);

			const [responseArgument] = theSpy.mock.calls[0].arguments;

			assert.strictEqual('meta' in (responseArgument as any), false);

			theSpy.mock.restore();
		});
	});
});
