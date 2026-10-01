import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { JsonRpcError, METHOD_NOT_FOUND, SERVER_ERROR } from '../../lib/jsonrpc';
import handleApp from '../app/handler';
import { createMockApp, createMockRequest } from './helpers/mod';

/**
 * `JsonRpcError` is not an `Error` subclass, so the catch in `handleApp` has to test for
 * it on its own. This pins the code that reaches the host: `AppListenerManager` and
 * `AppVideoConfProvider` branch on `-32601`, and a payload that fell through to
 * `SERVER_ERROR` would break that contract silently.
 */
describe('handlers > app', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('app', createMockApp());
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('should answer an unknown app method with METHOD_NOT_FOUND', async () => {
		const result = await handleApp(createMockRequest({ method: 'app:thisMethodDoesNotExist', params: [] }));

		assert.ok(result instanceof JsonRpcError);
		assert.strictEqual(result.code, METHOD_NOT_FOUND);
		assert.notStrictEqual(result.code, SERVER_ERROR);
		assert.match(result.message, /thisMethodDoesNotExist/);
	});
});
