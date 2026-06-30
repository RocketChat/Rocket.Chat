import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

// proxyquire previously rebuilt the stubs and re-`load`ed the module every test (via
// noPreserveCache). With vi.mock the module is loaded once against stable stubs that we reset and
// reconfigure per test. `mem` is stubbed to return the function as-is (no caching) so the wrapped
// `getMessageToBroadcast` always reads the current stub behaviour.
const { getSettingValueByIdStub, usersFindOneStub, messagesFindOneStub, broadcastStub, memStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		getSettingValueByIdStub: sinon.stub(),
		usersFindOneStub: sinon.stub(),
		messagesFindOneStub: sinon.stub(),
		broadcastStub: sinon.stub(),
		memStub: sinon.stub().callsFake((fn: any) => fn),
	};
});

vi.mock('@rocket.chat/models', () => ({
	Messages: {
		findOneById: messagesFindOneStub,
	},
	Users: {
		findOne: usersFindOneStub,
	},
	Settings: {
		getValueById: getSettingValueByIdStub,
	},
}));
vi.mock('@rocket.chat/core-services', () => ({
	api: {
		broadcast: broadcastStub,
	},
}));
vi.mock('mem', () => ({ default: memStub }));

const { getMessageToBroadcast, notifyOnMessageChange } = await import('../../../../../../app/lib/server/lib/notifyListener');

describe('Message Broadcast Tests', () => {
	const sampleMessage: IMessage = {
		_id: '123',
		rid: 'room1',
		msg: 'Hello',
		ts: new Date(),
		u: { _id: 'user1', username: 'user1', name: 'Real User' },
		mentions: [],
		t: 'user-muted',
		_updatedAt: new Date(),
	};

	beforeEach(() => {
		getSettingValueByIdStub.reset();
		usersFindOneStub.reset();
		messagesFindOneStub.reset();
		broadcastStub.reset();
	});

	describe('getMessageToBroadcast', () => {
		let originalEnv: NodeJS.ProcessEnv;

		beforeEach(() => {
			originalEnv = { ...process.env };
			sinon.resetHistory();
		});

		afterEach(() => {
			process.env = originalEnv;
		});

		const testCases = [
			{
				description: 'should return undefined if message is hidden',
				message: { ...sampleMessage, _hidden: true },
				hideSystemMessages: [],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should return undefined if message is imported',
				message: { ...sampleMessage, imported: true },
				hideSystemMessages: [],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should hide message if type is in hideSystemMessage settings',
				message: sampleMessage,
				hideSystemMessages: ['user-muted', 'mute_unmute'],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should return the message with real name if useRealName is true',
				message: sampleMessage,
				hideSystemMessages: [],
				useRealName: true,
				expectedResult: { ...sampleMessage, u: { ...sampleMessage.u, name: 'Real User' } },
			},
			{
				description: 'should return the message with mentions real name if useRealName is true',
				message: {
					...sampleMessage,
					mentions: [
						{ _id: 'mention1', username: 'mention1', name: 'Mention 1' },
						{ _id: 'mention2', username: 'mention2', name: 'Mention 2' },
					],
				},
				hideSystemMessages: [],
				useRealName: true,
				expectedResult: {
					...sampleMessage,
					u: { ...sampleMessage.u, name: 'Real User' },
					mentions: [
						{ _id: 'mention1', username: 'mention1', name: 'Mention 1' },
						{ _id: 'mention2', username: 'mention2', name: 'Mention 2' },
					],
				},
			},
			{
				description: 'should return the message if Hide_System_Messages is undefined',
				message: sampleMessage,
				hideSystemMessages: undefined,
				useRealName: false,
				expectedResult: sampleMessage,
			},
			{
				description: 'should return undefined if the message type is muted and a mute_unmute is received',
				message: { ...sampleMessage, t: 'mute_unmute' },
				hideSystemMessages: ['user-muted', 'mute_unmute'],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should return the message if no system messages are muted',
				message: sampleMessage,
				hideSystemMessages: [],
				useRealName: false,
				expectedResult: sampleMessage,
			},
			{
				description: 'should hide message if type is room-archived',
				message: { ...sampleMessage, t: 'room-archived' },
				hideSystemMessages: ['room-archived'],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should hide message if type is user-unmuted',
				message: { ...sampleMessage, t: 'user-unmuted' },
				hideSystemMessages: ['user-unmuted'],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should hide message if type is subscription-role-added',
				message: { ...sampleMessage, t: 'subscription-role-added' },
				hideSystemMessages: ['subscription-role-added'],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should hide message if type is message_pinned',
				message: { ...sampleMessage, t: 'message_pinned' },
				hideSystemMessages: ['message_pinned'],
				useRealName: false,
				expectedResult: undefined,
			},
			{
				description: 'should hide message if type is new-owner',
				message: { ...sampleMessage, t: 'new-owner' },
				hideSystemMessages: ['new-owner'],
				useRealName: false,
				expectedResult: undefined,
			},
		];

		testCases.forEach(({ description, message, hideSystemMessages, useRealName, expectedResult }) => {
			it(description, async () => {
				messagesFindOneStub.resolves(message);
				getSettingValueByIdStub.withArgs('Hide_System_Messages').resolves(hideSystemMessages);
				getSettingValueByIdStub.withArgs('UI_Use_Real_Name').resolves(useRealName);

				if (useRealName) {
					const realNames =
						message.mentions && message.mentions.length > 0
							? [message.u.name, ...message.mentions.map((mention) => mention.name)]
							: [message.u.name];

					realNames.forEach((user, index) => usersFindOneStub.onCall(index).resolves({ name: user }));
				}

				const result = await getMessageToBroadcast({ id: '123' });

				expect(result).to.deep.equal(expectedResult);
			});
		});
	});

	describe('notifyOnMessageChange', () => {
		const testCases = [
			{
				description: 'should broadcast the message if there is data attributes',
				expectBroadcast: true,
				message: sampleMessage,
			},
			{
				description: 'should not broadcast the message if there is no data attributes',
				expectBroadcast: false,
				message: null,
			},
		];

		testCases.forEach(({ description, expectBroadcast, message }) => {
			it(description, async () => {
				messagesFindOneStub.resolves(message);
				getSettingValueByIdStub.resolves([]);

				await notifyOnMessageChange({ id: '123', data: message });

				if (expectBroadcast) {
					expect(broadcastStub.calledOnce).to.be.true;
					expect(broadcastStub.calledOnceWith('watch.messages', { message })).to.be.true;
				} else {
					expect(broadcastStub.called).to.be.false;
				}
			});
		});
	});
});
