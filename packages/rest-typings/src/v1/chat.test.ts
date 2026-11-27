import assert from 'node:assert';
import { describe, it } from 'node:test';

import { chatSendMessageFieldNames, isChatPostMessageProps, isChatSendMessageProps } from './chat';

describe('chat sentWithAI flag', () => {
	describe('isChatPostMessageProps', () => {
		it('should accept sentWithAI: true when posting by room id', () => {
			assert.equal(isChatPostMessageProps({ roomId: 'rid', text: 'hi', sentWithAI: true }), true);
		});

		it('should accept sentWithAI: true when posting by channel name', () => {
			assert.equal(isChatPostMessageProps({ channel: '#general', text: 'hi', sentWithAI: true }), true);
		});

		it('should reject sentWithAI: false', () => {
			assert.equal(isChatPostMessageProps({ roomId: 'rid', text: 'hi', sentWithAI: false }), false);
			assert.equal(isChatPostMessageProps({ channel: '#general', text: 'hi', sentWithAI: false }), false);
		});

		it('should reject sentWithAI: null', () => {
			assert.equal(isChatPostMessageProps({ roomId: 'rid', text: 'hi', sentWithAI: null }), false);
		});
	});

	describe('isChatSendMessageProps', () => {
		it('should accept message.sentWithAI: true', () => {
			assert.equal(isChatSendMessageProps({ message: { rid: 'rid', msg: 'hi', sentWithAI: true } }), true);
		});

		it('should reject message.sentWithAI: false', () => {
			assert.equal(isChatSendMessageProps({ message: { rid: 'rid', msg: 'hi', sentWithAI: false } }), false);
		});

		it('should list sentWithAI among the fields a caller may set', () => {
			assert.ok(chatSendMessageFieldNames.includes('sentWithAI'));
		});
	});
});
