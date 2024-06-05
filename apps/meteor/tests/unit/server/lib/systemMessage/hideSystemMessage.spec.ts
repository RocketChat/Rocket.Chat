import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getValueByIdStub = sinon.stub();

const { isMutedUnmuted, getCachedHiddenSystemMessage, shouldHideSystemMessage } = proxyquire
	.noCallThru()
	.load('../../../../../server/lib/systemMessage/hideSystemMessage', {
		'@rocket.chat/models': {
			Settings: {
				getValueById: getValueByIdStub,
			},
		},
		'mem': (fn: any) => fn,
	});

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

	describe('getCachedHiddenSystemMessage', () => {
		beforeEach(() => {
			getValueByIdStub.reset();
		});

		it('should return hidden system messages from settings', async () => {
			const hiddenMessages: MessageTypesValues[] = ['user-muted', 'user-unmuted'];
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(hiddenMessages);

			const result = await getCachedHiddenSystemMessage();
			expect(result).to.deep.equal(hiddenMessages);
		});

		it('should return an empty undefined if no settings found', async () => {
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(undefined);

			const result = await getCachedHiddenSystemMessage();
			expect(result).to.deep.equal(undefined);
		});
	});

	describe('shouldHideSystemMessage', () => {
		beforeEach(() => {
			getValueByIdStub.reset();
		});

		it('should return true if message type is in hidden system messages', async () => {
			const hiddenMessages: MessageTypesValues[] = ['user-muted', 'mute_unmute'];
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(hiddenMessages);

			const result = await shouldHideSystemMessage('user-muted');
			expect(result).to.be.true;
		});

		it('should return true if message type is user-muted and mute_unmute is in hidden system messages', async () => {
			const hiddenMessages: MessageTypesValues[] = ['mute_unmute'];
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(hiddenMessages);

			const result = await shouldHideSystemMessage('user-muted');
			expect(result).to.be.true;
		});

		it('should return false if message type is not in hidden system messages', async () => {
			const hiddenMessages: MessageTypesValues[] = ['room-archived'];
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(hiddenMessages);

			const result = await shouldHideSystemMessage('user-muted');
			expect(result).to.be.false;
		});

		it('should return false if hidden system messages are undefined', async () => {
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(undefined);

			const result = await shouldHideSystemMessage('user-muted');
			expect(result).to.be.false;
		});
	});
});
