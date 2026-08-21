import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { normalizeRuntimeMethodLabel } from '../../../src/server/runtime/RuntimeMetrics';

describe('normalizeRuntimeMethodLabel', () => {
	it('keeps the method name for app lifecycle/event methods', () => {
		assert.strictEqual(normalizeRuntimeMethodLabel('app:executePostMessageSent'), 'executePostMessageSent');
		assert.strictEqual(normalizeRuntimeMethodLabel('app:getStatus'), 'getStatus');
	});

	it('collapses categories that embed unbounded ids to the category alone', () => {
		assert.strictEqual(normalizeRuntimeMethodLabel('api:users/list:GET'), 'api');
		assert.strictEqual(normalizeRuntimeMethodLabel('slashcommand:my-command:executor'), 'slashcommand');
		assert.strictEqual(normalizeRuntimeMethodLabel('scheduler:some-processor-id'), 'scheduler');
		assert.strictEqual(normalizeRuntimeMethodLabel('outboundCommunication:provider:sendOutboundMessage'), 'outboundCommunication');
		assert.strictEqual(normalizeRuntimeMethodLabel('videoconference:provider:generateUrl'), 'videoconference');
	});

	it('returns methods without a namespace unchanged', () => {
		assert.strictEqual(normalizeRuntimeMethodLabel('ready'), 'ready');
	});
});
