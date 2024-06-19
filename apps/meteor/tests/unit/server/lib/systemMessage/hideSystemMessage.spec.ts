import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { isMutedUnmuted, shouldHideSystemMessage } from '../../../../../server/lib/systemMessage/hideSystemMessage';

describe('hideSystemMessage', () => {
	describe('isMutedUnmuted', () => {
		it('should return true for user-muted', () => {
			expect(isMutedUnmuted('user-muted')).to.be.true;
		});

		it('should return true for user-unmuted', () => {
			expect(isMutedUnmuted('user-unmuted')).to.be.true;
		});

		it('should return false for other message types', () => {
			expect(isMutedUnmuted('some-other-type')).to.be.false;
		});
	});

	describe('shouldHideSystemMessage', () => {
		it('should return true if message type is in hidden system messages', async () => {
			const hiddenMessages: MessageTypesValues[] = ['user-muted', 'mute_unmute'];

			const result = shouldHideSystemMessage('user-muted', hiddenMessages);
			expect(result).to.be.true;
		});

		it('should return true if message type is user-muted and mute_unmute is in hidden system messages', async () => {
			const hiddenMessages: MessageTypesValues[] = ['mute_unmute'];

			const result = shouldHideSystemMessage('user-muted', hiddenMessages);
			expect(result).to.be.true;
		});

		it('should return false if message type is not in hidden system messages', async () => {
			const hiddenMessages: MessageTypesValues[] = ['room-archived'];

			const result = shouldHideSystemMessage('user-muted', hiddenMessages);
			expect(result).to.be.false;
		});

		it('should return false if hidden system messages are undefined', async () => {
			const result = shouldHideSystemMessage('user-muted', undefined);
			expect(result).to.be.false;
		});
	});
});
