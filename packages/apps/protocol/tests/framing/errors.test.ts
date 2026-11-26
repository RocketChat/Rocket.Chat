import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';

import { ErrorCode, toServerErrorData } from '../../src/framing/errors';
import { JsonRpcError } from '../../src/framing/jsonrpc';

describe('ErrorCode', () => {
	it('keeps the code of an Apps-Engine exception equal to the one apps-engine defines', () => {
		assert.strictEqual(ErrorCode.APPS_ENGINE_EXCEPTION, AppsEngineException.JSONRPC_ERROR_CODE);
	});

	it('holds each code once', () => {
		const codes = Object.values(ErrorCode);

		assert.strictEqual(new Set(codes).size, codes.length);
	});

	it('puts the context of a standard-code error in data.detail', () => {
		assert.deepStrictEqual(JsonRpcError.invalidParams({ field: 'a' }).data, { detail: { field: 'a' } });
		assert.strictEqual('data' in JsonRpcError.methodNotFound(), false);
	});

	it('keeps the identity of a thrown Error in the data of SERVER_ERROR, never the Error itself', () => {
		const data = toServerErrorData(new TypeError('boom'));

		assert.strictEqual(data.name, 'TypeError');
		assert.strictEqual(typeof data.stack, 'string');
		assert.strictEqual(data instanceof Error, false);
	});
});
