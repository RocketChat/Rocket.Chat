import type { IMessage } from '@rocket.chat/core-typings';

import {
	appMessageMock,
	appMessageInvalidRoomMock,
	appPartialMessageMock,
} from '../../../../tests/unit/app/apps/server/mocks/data/messages.data';
import { MessagesMock } from '../../../../tests/unit/app/apps/server/mocks/models/Messages.mock';
import { RoomsMock } from '../../../../tests/unit/app/apps/server/mocks/models/Rooms.mock';
import { UsersMock } from '../../../../tests/unit/app/apps/server/mocks/models/Users.mock';
import { AppServerOrchestratorMock } from '../../../../tests/unit/app/apps/server/mocks/orchestrator.mock';

jest.mock('@rocket.chat/models', () => ({
	Rooms: new RoomsMock(),
	Messages: new MessagesMock(),
	Users: new UsersMock(),
}));

jest.mock('@rocket.chat/core-typings', () => ({
	...jest.requireActual('@rocket.chat/core-typings'),
	isMessageFromVisitor: (message: unknown) => message && typeof message === 'object' && 'token' in message,
}));

describe('The AppMessagesConverter instance', () => {
	let AppMessagesConverter: any;
	let messagesConverter: any;
	let messagesMock: MessagesMock;

	beforeAll(async () => {
		const module = await import('./messages');
		AppMessagesConverter = module.AppMessagesConverter;
	});

	beforeEach(() => {
		const orchestrator = new AppServerOrchestratorMock();

		const usersConverter = orchestrator.getConverters().get('users');

		if (usersConverter) {
			usersConverter.convertById = function convertUserByIdStub(id: string) {
				return UsersMock.convertedData[id as 'rocket.cat'];
			};

			usersConverter.convertToApp = function convertUserToAppStub(user: UsersMock['data']['rocket.cat']) {
				return {
					id: user._id,
					username: user.username,
					name: user.name,
				};
			};
		}

		const roomsConverter = orchestrator.getConverters().get('rooms');
		if (roomsConverter) {
			roomsConverter.convertById = async function convertRoomByIdStub(id: string) {
				return RoomsMock.convertedData[id as 'GENERAL'];
			};
		}

		messagesConverter = new AppMessagesConverter(orchestrator);
		messagesMock = new MessagesMock();
	});

	const createdAt = new Date('2019-03-30T01:22:08.389Z');
	const updatedAt = new Date('2019-03-30T01:22:08.412Z');

	describe('when converting a message from Rocket.Chat to the Engine schema', () => {
		it('should return `undefined` when `msgObj` is falsy', async () => {
			const appMessage = await messagesConverter.convertMessage(undefined);

			expect(appMessage).toBeUndefined();
		});

		it('should return a proper schema', async () => {
			const appMessage = await messagesConverter.convertMessage(messagesMock.findOneById('SimpleMessageMock'));

			expect(appMessage).toHaveProperty('id', 'SimpleMessageMock');
			expect(appMessage.createdAt).toEqual(createdAt);
			expect(appMessage.updatedAt).toEqual(updatedAt);
			expect(appMessage).toHaveProperty('groupable', false);
			expect(appMessage.sender).toMatchObject({ id: 'rocket.cat' });
			expect(appMessage.room).toMatchObject({ id: 'GENERAL' });

			expect(appMessage).not.toHaveProperty('editor');
			expect(appMessage).not.toHaveProperty('attachments');
			expect(appMessage).not.toHaveProperty('reactions');
			expect(appMessage).not.toHaveProperty('avatarUrl');
			expect(appMessage).not.toHaveProperty('alias');
			expect(appMessage).not.toHaveProperty('customFields');
			expect(appMessage).not.toHaveProperty('emoji');
		});

		it('should not mutate the original message object', async () => {
			const rocketchatMessageMock = messagesMock.findOneById('SimpleMessageMock') as IMessage;

			await messagesConverter.convertMessage(rocketchatMessageMock);

			expect(rocketchatMessageMock).toEqual({
				_id: 'SimpleMessageMock',
				t: 'uj',
				rid: 'GENERAL',
				ts: new Date('2019-03-30T01:22:08.389Z'),
				msg: 'rocket.cat',
				u: {
					_id: 'rocket.cat',
					username: 'rocket.cat',
				},
				groupable: false,
				_updatedAt: new Date('2019-03-30T01:22:08.412Z'),
			});
		});

		it("should return basic sender info when it's not a Rocket.Chat user (e.g. Livechat Guest)", async () => {
			const appMessage = await messagesConverter.convertMessage(messagesMock.findOneById('LivechatGuestMessageMock'));

			expect(appMessage.sender).toMatchObject({
				id: 'guest1234',
				username: 'guest1234',
				name: 'Livechat Guest',
			});
		});
	});

	describe('when converting a message from the Engine schema back to Rocket.Chat', () => {
		it('should return `undefined` when `message` is falsy', async () => {
			const rocketchatMessage = await messagesConverter.convertAppMessage(undefined);

			expect(rocketchatMessage).toBeUndefined();
		});

		it('should return a proper schema', async () => {
			const rocketchatMessage = await messagesConverter.convertAppMessage(appMessageMock);

			expect(rocketchatMessage).toHaveProperty('_id', 'appMessageMock');
			expect(rocketchatMessage).toHaveProperty('rid', 'GENERAL');
			expect(rocketchatMessage).toHaveProperty('groupable', false);
			expect(rocketchatMessage.ts).toEqual(createdAt);
			expect(rocketchatMessage._updatedAt).toEqual(updatedAt);
			expect(rocketchatMessage.u).toMatchObject({
				_id: 'rocket.cat',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
			});
		});

		it('should return a proper schema when receiving a partial object', async () => {
			const rocketchatMessage = await messagesConverter.convertAppMessage(appPartialMessageMock, true);

			expect(rocketchatMessage).toHaveProperty('_id', 'appPartialMessageMock');
			expect(rocketchatMessage).toHaveProperty('groupable', false);
			expect(rocketchatMessage).toHaveProperty('emoji', ':smirk:');
			expect(rocketchatMessage).toHaveProperty('alias', 'rocket.feline');

			expect(rocketchatMessage).not.toHaveProperty('ts');
			expect(rocketchatMessage).not.toHaveProperty('u');
			expect(rocketchatMessage).not.toHaveProperty('rid');
			expect(rocketchatMessage).not.toHaveProperty('_updatedAt');
		});

		it('should merge `_unmappedProperties_` into the returned message', async () => {
			const rocketchatMessage = await messagesConverter.convertAppMessage(appMessageMock);

			expect(rocketchatMessage).not.toHaveProperty('_unmappedProperties_');
			expect(rocketchatMessage).toHaveProperty('t', 'uj');
		});

		it('should not merge `_unmappedProperties_` into the returned message when receiving a partial object', async () => {
			const invalidPartialMessage = structuredClone(appPartialMessageMock) as typeof appPartialMessageMock & {
				_unmappedProperties_?: Record<string, unknown>;
			};
			invalidPartialMessage._unmappedProperties_ = {
				t: 'uj',
			};

			const rocketchatMessage = await messagesConverter.convertAppMessage(invalidPartialMessage, true);

			expect(rocketchatMessage).not.toHaveProperty('_unmappedProperties_');
			expect(rocketchatMessage).not.toHaveProperty('t');
		});

		it('should throw if message has an invalid room', async () => {
			await expect(messagesConverter.convertAppMessage(appMessageInvalidRoomMock)).rejects.toThrow('Invalid room provided on the message.');
		});
	});
});
