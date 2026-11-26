import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { _zPING, _zPONG, isControlFrame } from '../../src/index';

describe('isControlFrame', () => {
	it('accepts the ping and pong frames', () => {
		assert.strictEqual(isControlFrame(_zPING), true);
		assert.strictEqual(isControlFrame(_zPONG), true);
	});

	it('rejects any other message', () => {
		assert.strictEqual(isControlFrame('ping'), false);
		assert.strictEqual(isControlFrame({ jsonrpc: '2.0', method: 'ping' }), false);
		assert.strictEqual(isControlFrame(undefined), false);
	});
});
