import type { IAppRoomsConverter, IAppsRoom } from '@rocket.chat/apps';
import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import proxyquire from 'proxyquire';

import { MessagesMock } from './mocks/models/Messages.mock';
import { RoomsMock } from './mocks/models/Rooms.mock';
import { UsersMock } from './mocks/models/Users.mock';
import { AppServerOrchestratorMock } from './mocks/orchestrator.mock';

const { AppRoomsConverter } = proxyquire.noCallThru().load('../../../../../app/apps/server/converters/rooms', {
	'@rocket.chat/random': {
		Random: {
			id: () => 1,
		},
	},
	'@rocket.chat/models': {
		Rooms: new RoomsMock(),
		Messages: new MessagesMock(),
		Users: new UsersMock(),
	},
});

describe('The AppMessagesConverter instance', () => {
	let roomConverter: IAppRoomsConverter;
	let roomsMock: RoomsMock;

	before(() => {
		const orchestrator = new AppServerOrchestratorMock();

		const usersConverter = orchestrator.getConverters().get('users');

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

		orchestrator.getConverters().get('messages').convertById = async function convertRoomByIdStub(_id: string) {
			return {};
		};

		roomConverter = new AppRoomsConverter(orchestrator);
		roomsMock = new RoomsMock();
	});

	describe('when converting a room from Rocket.Chat to the Engine schema', () => {
		it('should return `undefined` when `originalRoom` is falsy', async () => {
			const appRoom = await roomConverter.convertRoom(undefined);

			expect(appRoom).to.be.undefined;
		});

		it('should return a proper schema', async () => {
			const mockedRoom = roomsMock.findOneById('GENERAL') as RoomsMock['data']['GENERAL'];
			const appRoom = await roomConverter.convertRoom(mockedRoom as unknown as IRoom);

			expect(appRoom).to.have.property('id', mockedRoom._id);
			expect(appRoom).to.have.property('type', mockedRoom.t);
			expect(appRoom).to.have.property('slugifiedName', mockedRoom.name);
			expect(appRoom).to.have.property('createdAt').which.equalTime(mockedRoom.ts);
			expect(appRoom).to.have.property('updatedAt').which.equalTime(mockedRoom._updatedAt);
			expect(appRoom).to.have.property('messageCount', mockedRoom.msgs);
		});

		it('should not mutate the original room object', async () => {
			const rocketchatRoomMock = structuredClone(roomsMock.findOneById('GENERAL'));

			await roomConverter.convertRoom(rocketchatRoomMock);

			expect(rocketchatRoomMock).to.deep.equal(roomsMock.findOneById('GENERAL'));
		});

		it('should add an `_unmappedProperties_` field to the converted room which contains the `lastMessage` property of the room', async () => {
			const mockedRoom = roomsMock.findOneById('GENERAL') as RoomsMock['data']['GENERAL'];
			const appMessage = await roomConverter.convertRoom(mockedRoom as unknown as IRoom);

			expect(appMessage).to.have.property('_unmappedProperties_').which.has.property('lastMessage').to.deep.equal(mockedRoom.lastMessage);
		});
	});

	describe('when converting a room from the Engine schema back to Rocket.Chat', () => {
		it('should return `undefined` when `room` is falsy', async () => {
			const rocketchatMessage = await roomConverter.convertAppRoom(undefined);

			expect(rocketchatMessage).to.be.undefined;
		});

		it('should return a proper schema', async () => {
			const appRoom = RoomsMock.convertedData.GENERAL as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom);

			expect(rocketchatRoom).to.have.property('_id', appRoom.id);
			expect(rocketchatRoom).to.have.property('ts', appRoom.createdAt);
			expect(rocketchatRoom).to.have.property('lm', appRoom.lastModifiedAt);
			expect(rocketchatRoom).to.have.property('_updatedAt', appRoom.updatedAt);
			expect(rocketchatRoom).to.have.property('t', appRoom.type);
			expect(rocketchatRoom).to.have.property('name', appRoom.slugifiedName);
		});

		it('should return a proper schema when receiving a partial object', async () => {
			const appRoom = RoomsMock.convertedData.GENERALPartial as unknown as IAppsRoom;
			const rocketchatRoom = await roomConverter.convertAppRoom(appRoom, true);

			expect(rocketchatRoom).to.have.property('_id', appRoom.id);
			expect(rocketchatRoom).to.have.property('name', appRoom.slugifiedName);
			expect(rocketchatRoom).to.have.property('sysMes', appRoom.displaySystemMessages);
			expect(rocketchatRoom).to.have.property('msgs', 0);
			expect(rocketchatRoom).to.have.property('_updatedAt', appRoom.updatedAt);

			expect(rocketchatRoom).to.not.have.property('ro');
			expect(rocketchatRoom).to.not.have.property('default');
		});
	});
});
