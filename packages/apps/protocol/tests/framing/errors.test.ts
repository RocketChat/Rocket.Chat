import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';

import { ErrorCode } from '../../src/framing/errors';

describe('ErrorCode', () => {
	it('keeps the code of an Apps-Engine exception equal to the one apps-engine defines', () => {
		assert.strictEqual(ErrorCode.APPS_ENGINE_EXCEPTION, AppsEngineException.JSONRPC_ERROR_CODE);
	});

	it('holds each code once', () => {
		const codes = Object.values(ErrorCode);

		assert.strictEqual(new Set(codes).size, codes.length);
	});
});
