import { isVideoConfShareChatProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

/**
 * What this schema says that the others don't: a `mode` is optional, and when given it has to be one this server
 * can actually act on. The "rejects a non-object", "requires the id" and "refuses extra properties" cases are
 * `type: 'object'`, `required` and `additionalProperties: false` doing their job — ajv's, not ours.
 */
describe('isVideoConfShareChatProps', () => {
	it('accepts a callId with nothing else, leaving the choice to the room', () => {
		assert.isTrue(isVideoConfShareChatProps({ callId: 'callId' }));
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
