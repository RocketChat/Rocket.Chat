import * as assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import videoconfHandler from '../videoconference-handler';
import { createMockRequest } from './helpers/mod';
import { AppObjectRegistry } from '../../AppObjectRegistry';
import { JsonRpcError } from '../../lib/jsonrpc';

describe('handlers > videoconference', () => {
	const mockMethodWithoutParam = (read: any, modify: any, http: any, persis: any): Promise<string> => Promise.resolve('ok none');
	const mockMethodWithOneParam = (call: any, read: any, modify: any, http: any, persis: any): Promise<string> => Promise.resolve('ok one');
	const mockMethodWithTwoParam = (call: any, user: any, read: any, modify: any, http: any, persis: any): Promise<string> =>
		Promise.resolve('ok two');
	const mockMethodWithThreeParam = (call: any, user: any, options: any, read: any, modify: any, http: any, persis: any): Promise<string> =>
		Promise.resolve('ok three');
	const mockProvider = {
		empty: mockMethodWithoutParam,
		one: mockMethodWithOneParam,
		two: mockMethodWithTwoParam,
		three: mockMethodWithThreeParam,
		notAFunction: true,
		error: () => {
			throw new Error('Method execution error example');
		},
	};

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('videoConfProvider:test-provider', mockProvider);
	});

	it('correctly handles execution of a videoconf method without additional params', async () => {
		const _spy = mock.method(mockProvider, 'empty');

		const result = await videoconfHandler(createMockRequest({ method: 'videoconference:test-provider:empty', params: [] }));

		assert.deepStrictEqual(result, 'ok none');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 4);

		_spy.mock.restore();
	});

	it('correctly handles execution of a videoconf method with one param', async () => {
		const _spy = mock.method(mockProvider, 'one');

		const result = await videoconfHandler(createMockRequest({ method: 'videoconference:test-provider:one', params: ['call'] }));

		assert.deepStrictEqual(result, 'ok one');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 5);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'call');

		_spy.mock.restore();
	});

	it('correctly handles execution of a videoconf method with two params', async () => {
		const _spy = mock.method(mockProvider, 'two');

		const result = await videoconfHandler(createMockRequest({ method: 'videoconference:test-provider:two', params: ['call', 'user'] }));

		assert.deepStrictEqual(result, 'ok two');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'call');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'user');

		_spy.mock.restore();
	});

	it('correctly handles execution of a videoconf method with three params', async () => {
		const _spy = mock.method(mockProvider, 'three');

		const result = await videoconfHandler(
			createMockRequest({ method: 'videoconference:test-provider:three', params: ['call', 'user', 'options'] }),
		);

		assert.deepStrictEqual(result, 'ok three');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 7);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'call');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'user');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[2], 'options');

		_spy.mock.restore();
	});

	it('correctly handles an error on execution of a videoconf method', async () => {
		const result = await videoconfHandler(createMockRequest({ method: 'videoconference:test-provider:error', params: [] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, 'Method execution error example');
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles an error when provider is not found', async () => {
		const providerName = 'error-provider';
		const result = await videoconfHandler(createMockRequest({ method: `videoconference:${providerName}:method`, params: [] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, `Provider ${providerName} not found`);
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles an error if method is not a function of provider', async () => {
		const methodName = 'notAFunction';
		const providerName = 'test-provider';
		const result = await videoconfHandler(createMockRequest({ method: `videoconference:${providerName}:${methodName}`, params: [] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, 'Method not found');
		assert.strictEqual((result as any).code, -32601);
		assert.strictEqual((result as any).data.message, `Method ${methodName} not found on provider ${providerName}`);
	});
});
