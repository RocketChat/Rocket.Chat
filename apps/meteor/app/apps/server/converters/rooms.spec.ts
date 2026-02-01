import type { IAppRoomsConverter, IAppsRoom } from '@rocket.chat/apps';
import type { IRoom } from '@rocket.chat/core-typings';

import { MessagesMock } from '../../../../tests/unit/app/apps/server/mocks/models/Messages.mock';
import { RoomsMock } from '../../../../tests/unit/app/apps/server/mocks/models/Rooms.mock';
import { UsersMock } from '../../../../tests/unit/app/apps/server/mocks/models/Users.mock';
import { AppServerOrchestratorMock } from '../../../../tests/unit/app/apps/server/mocks/orchestrator.mock';

jest.mock('@rocket.chat/random', () => ({
	Random: {
		id: () => 1,
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Rooms: new RoomsMock(),
	Messages: new MessagesMock(),
	Users: new UsersMock(),
}));

describe('The AppMessagesConverter instance', () => {
	let AppRoomsConverter: any;
	let roomConverter: IAppRoomsConverter;
	let roomsMock: RoomsMock;

	beforeAll(async () => {
		const module = await import('./rooms');
		AppRoomsConverter = module.AppRoomsConverter;
	});

	beforeEach(() => {
		const orchestrator = new AppServerOrchestratorMock();

		const usersConverter = orchestrator.getConverters().get('users');

		if (usersConverter) {
			usersConverter.convertById = function convertUserByIdStub(id: string) {
				return UsersMock.convertedData[id as 'rocket.cat'] || undefined;
			};

			usersConverter.convertToApp = function convertUserToAppStub(user: UsersMock['data']['rocket.cat']) {
				return {
					id: user._id,
					username: user.username,
					name: user.name,
				};
			};
		}

		const messagesConverter = orchestrator.getConverters().get('messages');
		if (messagesConverter) {
			messagesConverter.convertById = async function convertRoomByIdStub(_id: string) {
				return {};
			};
		}

		roomConverter = new AppRoomsConverter(orchestrator);
		roomsMock = new RoomsMock();
	});

	describe('when converting a room from Rocket.Chat to the Engine schema', () => {
		it('should return `undefined` when `originalRoom` is falsy', async () => {
			const appRoom = await roomConverter.convertRoom(undefined);

			expect(appRoom).toBeUndefined();
		});

		it('should return a proper schema', async () => {
			const mockedRoom = roomsMock.findOneById('GENERAL') as RoomsMock['data']['GENERAL'];
			const appRoom = await roomConverter.convertRoom(mockedRoom as unknown as IRoom);

			expect(appRoom).toHaveProperty('id', mockedRoom._id);
			expect(appRoom).toHaveProperty('type', mockedRoom.t);
			expect(appRoom).toHaveProperty('slugifiedName', mockedRoom.name);
			expect(appRoom?.createdAt).toEqual(mockedRoom.ts);
			expect(appRoom?.updatedAt).toEqual(mockedRoom._updatedAt);
			expect(appRoom).toHaveProperty('messageCount', mockedRoom.msgs);
		});

		it('should not mutate the original room object', async () => {
			const rocketchatRoomMock = structuredClone(roomsMock.findOneById('GENERAL'));

			await roomConverter.convertRoom(rocketchatRoomMock);

			expect(rocketchatRoomMock).toEqual(roomsMock.findOneById('GENERAL'));
		});

		it('should add an `_unmappedProperties_` field to the converted room which contains the `lastMessage` property of the room', async () => {
			const mockedRoom = roomsMock.findOneById('GENERAL') as RoomsMock['data']['GENERAL'];
			const appMessage = await roomConverter.convertRoom(mockedRoom as unknown as IRoom);

			expect(appMessage).toHaveProperty('_unmappedProperties_');
			expect((appMessage as any)._unmappedProperties_).toHaveProperty('lastMessage');
			expect((appMessage as any)._unmappedProperties_.lastMessage).toEqual(mockedRoom.lastMessage);
		});
	});

	describe('when converting a room from the Engine schema back to Rocket.Chat', () => {
		it('should return `undefined` when `room` is falsy', async () => {
			const rocketchatMessage = await roomConverter.convertAppRoom(undefined);

			expect(rocketchatMessage).toBeUndefined();
		});

		it('should return a proper schema', async () => {
			const appRoom = RoomsMock.convertedData.GENERAL as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom);

			expect(rocketchatRoom).toHaveProperty('_id', appRoom.id);
			expect(rocketchatRoom).toHaveProperty('ts', appRoom.createdAt);
			expect(rocketchatRoom).toHaveProperty('lm', appRoom.lastModifiedAt);
			expect(rocketchatRoom).toHaveProperty('_updatedAt', appRoom.updatedAt);
			expect(rocketchatRoom).toHaveProperty('t', appRoom.type);
			expect(rocketchatRoom).toHaveProperty('name', appRoom.slugifiedName);
		});

		it('should return a proper schema when receiving a partial object', async () => {
			const appRoom = RoomsMock.convertedData.GENERALPartial as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom, true);

			expect(rocketchatRoom).toHaveProperty('_id', appRoom.id);
			expect(rocketchatRoom).toHaveProperty('name', appRoom.slugifiedName);
			expect(rocketchatRoom).toHaveProperty('sysMes', appRoom.displaySystemMessages);
			expect(rocketchatRoom).toHaveProperty('_updatedAt', appRoom.updatedAt);

			expect(rocketchatRoom).not.toHaveProperty('msgs');
			expect(rocketchatRoom).not.toHaveProperty('ro');
			expect(rocketchatRoom).not.toHaveProperty('default');
			expect(rocketchatRoom).not.toHaveProperty('t');
		});

		it('should return a proper schema when receiving a partial object', async () => {
			const appRoom = RoomsMock.convertedData.GENERALPartialWithOptionalProps as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom, true);

			expect(rocketchatRoom).toHaveProperty('_id', appRoom.id);
			expect(rocketchatRoom).toHaveProperty('name', appRoom.slugifiedName);
			expect(rocketchatRoom).toHaveProperty('sysMes', appRoom.displaySystemMessages);
			expect(rocketchatRoom).toHaveProperty('_updatedAt', appRoom.updatedAt);
			expect(rocketchatRoom).toHaveProperty('msgs', appRoom.messageCount);
			expect(rocketchatRoom).toHaveProperty('t', 'c');

			expect(rocketchatRoom).not.toHaveProperty('ro');
			expect(rocketchatRoom).not.toHaveProperty('default');
		});

		it('should not include properties that are not present in the app room', async () => {
			const appRoom = RoomsMock.convertedData.UpdatedRoom as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom, true);

			expect(rocketchatRoom).toHaveProperty('customFields');
			expect(rocketchatRoom).not.toHaveProperty('_id');
			expect(rocketchatRoom).not.toHaveProperty('t');
		});

		it('should not include name as undefined if the room doesnt have a name property', async () => {
			const appRoom = RoomsMock.convertedData.UpdatedRoom as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom, true);

			expect(rocketchatRoom?.name).toBeUndefined();
		});

		it('should include a name if the source room has slugifiedName property', async () => {
			const appRoom = RoomsMock.convertedData.GENERALPartialWithOptionalProps as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom, true);

			expect(rocketchatRoom?.name).toBe(appRoom.slugifiedName);
		});

		it('should not use _unmappedProperties when the room is a partial object', async () => {
			const appRoom = RoomsMock.convertedData.GENERALPartialWithOptionalProps as unknown as IAppsRoom;
			// @ts-expect-error - _unmappedProperties
			const rocketchatRoom = await roomConverter.convertAppRoom({ ...appRoom, _unmappedProperties_: { unmapped: 'property' } }, true);

			expect(rocketchatRoom).not.toHaveProperty('unmapped');
		});

		it('should use _unmappedProperties when the room is a partial object', async () => {
			const appRoom = RoomsMock.convertedData.GENERALPartialWithOptionalProps as unknown as IAppsRoom;
			// @ts-expect-error - _unmappedProperties
			const rocketchatRoom = await roomConverter.convertAppRoom({ ...appRoom, _unmappedProperties_: { unmapped: 'property' } }, false);

			expect(rocketchatRoom).toHaveProperty('unmapped', 'property');
		});
	});
});
