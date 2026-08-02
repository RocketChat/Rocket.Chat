import { isVideoConfShareChatProps } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('VideoConfShareChatProps (definition/rest/v1)', () => {
	describe('isVideoConfShareChatProps', () => {
		it('should return false when provided anything that is not an VideoConfShareChatProps', () => {
			assert.isFalse(isVideoConfShareChatProps(undefined));
			assert.isFalse(isVideoConfShareChatProps(null));
			assert.isFalse(isVideoConfShareChatProps(''));
			assert.isFalse(isVideoConfShareChatProps(123));
			assert.isFalse(isVideoConfShareChatProps([]));
		});

		it('should return false if callId is not provided', () => {
			assert.isFalse(isVideoConfShareChatProps({}));
			assert.isFalse(isVideoConfShareChatProps({ mode: 'invite' }));
		});

		it('should accept a callId with nothing else, leaving the choice to the room', () => {
			assert.isTrue(isVideoConfShareChatProps({ callId: 'callId' }));
		});

		it('should accept either way of sharing the chat', () => {
			assert.isTrue(isVideoConfShareChatProps({ callId: 'callId', mode: 'invite' }));
			assert.isTrue(isVideoConfShareChatProps({ callId: 'callId', mode: 'discussion' }));
		});

		it('should reject a mode it cannot act on', () => {
			assert.isFalse(isVideoConfShareChatProps({ callId: 'callId', mode: 'whatever' }));
			assert.isFalse(isVideoConfShareChatProps({ callId: 'callId', mode: '' }));
		});

		it('should return false when extra parameters are provided', () => {
			assert.isFalse(isVideoConfShareChatProps({ callId: 'callId', extra: 'extra' }));
		});
	});
});
