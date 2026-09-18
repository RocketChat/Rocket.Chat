import { isVideoConfShareChatProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

/**
 * What this schema says that the others don't: a `mode` is required, and has to be one this server can actually
 * act on. The "rejects a non-object", "requires the id" and "refuses extra properties" cases are
 * `type: 'object'`, `required` and `additionalProperties: false` doing their job — ajv's, not ours.
 */
describe('isVideoConfShareChatProps', () => {
	// The caller shows which way it is sharing rather than letting the endpoint pick, so a body without one is
	// an incomplete request, not a request for the default.
	it('rejects a callId with no mode', () => {
		assert.isFalse(isVideoConfShareChatProps({ callId: 'callId' }));
	});

	it('accepts either way of sharing the chat', () => {
		assert.isTrue(isVideoConfShareChatProps({ callId: 'callId', mode: 'invite' }));
		assert.isTrue(isVideoConfShareChatProps({ callId: 'callId', mode: 'discussion' }));
	});

	// Silently doing the other thing would give away history nobody agreed to give away.
	it('rejects a mode it cannot act on', () => {
		assert.isFalse(isVideoConfShareChatProps({ callId: 'callId', mode: 'whatever' }));
		assert.isFalse(isVideoConfShareChatProps({ callId: 'callId', mode: '' }));
	});
});
