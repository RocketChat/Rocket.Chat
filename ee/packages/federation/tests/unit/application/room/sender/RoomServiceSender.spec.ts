import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { faker } from '@faker-js/faker';

import type * as RoomServiceSenderModule from '../../../../../src/application/room/sender/RoomServiceSender';
import type * as FederatedUserModule from '../../../../../src/domain/FederatedUser';
import type * as FederatedRoomModule from '../../../../../src/domain/FederatedRoom';
import { MATRIX_POWER_LEVELS } from '../../../../../src/infrastructure/matrix/definitions/MatrixPowerLevels';

function createFakeUser(overrides?: Record<string, any>): IUser {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		createdAt: faker.date.recent(),
		roles: ['user'],
		active: faker.datatype.boolean(),
		type: 'user',
		...overrides,
	};
}

export function createFakeMessage(overrides?: Record<string, any>): IMessage {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		rid: faker.database.mongodbObjectId(),
		msg: faker.lorem.sentence(),
		ts: faker.date.recent(),
		u: {
			_id: faker.database.mongodbObjectId(),
			username: faker.internet.userName(),
			name: faker.person.fullName(),
			...overrides?.u,
		},
		...overrides,
	};
}

const sendMessageStub = sinon.stub();
const sendQuoteMessageStub = sinon.stub();
const { FederationRoomServiceSender } = proxyquire
	.noCallThru()
	.load<typeof RoomServiceSenderModule>('../../../../../src/application/room/sender/RoomServiceSender', {
		'mongodb': {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
		'../message/sender/message-sender-helper': {
			getExternalMessageSender: () => ({ sendMessage: sendMessageStub, sendQuoteMessage: sendQuoteMessageStub }),
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load<typeof FederatedUserModule>('../../../../../src/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

const { DirectMessageFederatedRoom, FederatedRoom } = proxyquire
	.noCallThru()
	.load<typeof FederatedRoomModule>('../../../../../src/domain/FederatedRoom', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('Federation - Application - FederationRoomServiceSender', () => {
	let service: InstanceType<typeof FederationRoomServiceSender>;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		createFederatedRoomForDirectMessage: sinon.stub(),
		getDirectMessageFederatedRoomByUserIds: sinon.stub(),
		addUserToRoom: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		getInternalRoomRolesByUserId: sinon.stub(),
		applyRoomRolesToUser: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
		getInternalRoomById: sinon.stub(),
		isUserAlreadyJoined: sinon.stub(),
		getFederatedRoomByExternalId: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
		createLocalUser: sinon.stub(),
		updateFederationAvatar: sinon.stub(),
		setAvatar: sinon.stub(),
		updateRealName: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
		isFederationEnabled: sinon.stub(),
		getMaximumSizeOfUsersWhenJoiningPublicRooms: sinon.stub(),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub().resolves(undefined),
	};
	const messageAdapter = {
		getMessageById: sinon.stub(),
		setExternalFederationEventOnMessage: sinon.stub(),
	};
	const notificationsAdapter = {
		subscribeToUserTypingEventsOnFederatedRoomId: sinon.stub(),
		broadcastUserTypingOnRoom: sinon.stub(),
		notifyWithEphemeralMessage: sinon.stub(),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		extractHomeserverOrigin: sinon.stub(),
		sendMessage: sinon.stub(),
		createUser: sinon.stub(),
		inviteToRoom: sinon.stub().returns(new Promise((resolve) => resolve({}))),
		createDirectMessageRoom: sinon.stub(),
		joinRoom: sinon.stub(),
		leaveRoom: sinon.stub(),
		kickUserFromRoom: sinon.stub(),
		redactEvent: sinon.stub(),
		updateMessage: sinon.stub(),
		setRoomPowerLevels: sinon.stub(),
		setRoomName: sinon.stub(),
		getRoomName: sinon.stub(),
		setRoomTopic: sinon.stub(),
		getRoomTopic: sinon.stub(),
		searchPublicRooms: sinon.stub(),
		createRoom: sinon.stub(),
		convertMatrixUrlToHttp: sinon.stub().returns('toHttpUrl'),
		getRoomData: sinon.stub(),
	};
	const queueAdapter = {
		enqueueJob: sinon.stub(),
	};
	const invitees = [
		{
			inviteeUsernameOnly: 'marcos.defendi',
			normalizedInviteeId: 'marcos.defendi:matrix.com',
			rawInviteeId: '@marcos.defendi:matrix.com',
		},
	];

	beforeEach(() => {
		service = new FederationRoomServiceSender(
			roomAdapter as any,
			userAdapter as any,
			fileAdapter as any,
			messageAdapter as any,
			settingsAdapter as any,
			notificationsAdapter as any,
			queueAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.createFederatedRoomForDirectMessage.reset();
		roomAdapter.getDirectMessageFederatedRoomByUserIds.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.getInternalRoomRolesByUserId.reset();
		roomAdapter.applyRoomRolesToUser.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.getInternalRoomById.reset();
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		userAdapter.getInternalUserByUsername.reset();
		userAdapter.createLocalUser.reset();
		userAdapter.updateFederationAvatar.reset();
		userAdapter.setAvatar.reset();
		userAdapter.updateRealName.reset();
		bridge.extractHomeserverOrigin.reset();
		bridge.sendMessage.reset();
		bridge.createUser.reset();
		bridge.createDirectMessageRoom.reset();
		bridge.inviteToRoom.reset();
		bridge.joinRoom.reset();
		bridge.leaveRoom.reset();
		bridge.kickUserFromRoom.reset();
		bridge.redactEvent.reset();
		bridge.updateMessage.reset();
		bridge.setRoomPowerLevels.reset();
		bridge.setRoomTopic.reset();
		bridge.setRoomName.reset();
		bridge.getRoomName.reset();
		bridge.getRoomTopic.reset();
		bridge.createRoom.reset();
		bridge.getUserProfileInformation.reset();
		bridge.searchPublicRooms.reset();
		bridge.getRoomData.reset();
		messageAdapter.getMessageById.reset();
		messageAdapter.setExternalFederationEventOnMessage.reset();
		notificationsAdapter.subscribeToUserTypingEventsOnFederatedRoomId.reset();
		notificationsAdapter.notifyWithEphemeralMessage.reset();
		notificationsAdapter.broadcastUserTypingOnRoom.reset();
		sendMessageStub.reset();
		sendQuoteMessageStub.reset();
		queueAdapter.enqueueJob.reset();
		settingsAdapter.isFederationEnabled.reset();
		settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.reset();
	});

	describe('#createDirectMessageRoomAndInviteUser()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT create the inviter user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			await service.createDirectMessageRoomAndInviteUser({} as any);

			sinon.assert.notCalled(userAdapter.createFederatedUser);
		});

		it('should create the inviter user both externally and internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.createUser.resolves('externalInviterId');
			await service.createDirectMessageRoomAndInviteUser({ externalInviterId: 'externalInviterId' } as any);
			const inviter = FederatedUser.createInstance('externalInviterId', {
				name: 'name',
				username: 'username',
				existsOnlyOnProxyServer: true,
			});

			sinon.assert.calledWith(bridge.createUser, 'username', 'name', 'localDomain');
			sinon.assert.calledWith(userAdapter.createFederatedUser, inviter);
		});

		it('should NOT create the invitee user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getInternalUserById.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
			} as any);

			sinon.assert.notCalled(userAdapter.createFederatedUser);
		});

		it('should create the invitee user internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			userAdapter.getInternalUserById.resolves(user);
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
			} as any);
			const invitee = FederatedUser.createInstance('rawInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});

			sinon.assert.calledWith(userAdapter.createFederatedUser, invitee);
		});

		it('should throw an error when the inviter does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username' } as any);

			await expect(
				service.createDirectMessageRoomAndInviteUser({
					normalizedInviteeId: 'normalizedInviteeId',
					rawInviteeId: 'rawInviteeId',
					internalInviterId: 'internalInviterId',
					internalRoomId: 'internalRoomId',
					inviteeUsernameOnly: 'true',
				}),
			).to.be.rejectedWith('Could not find inviter or invitee user');
		});

		it('should throw an error when the invitee does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username' } as any);

			await expect(
				service.createDirectMessageRoomAndInviteUser({
					normalizedInviteeId: 'normalizedInviteeId',
					rawInviteeId: 'rawInviteeId',
					internalInviterId: 'internalInviterId',
					internalRoomId: 'internalRoomId',
					inviteeUsernameOnly: 'true',
				}),
			).to.be.rejectedWith('Could not find inviter or invitee user');
		});

		it('should NOT create the room if it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
				inviteeUsernameOnly: 'true',
			});

			sinon.assert.notCalled(roomAdapter.createFederatedRoomForDirectMessage);
		});

		it('should create the room both externally and internally if it does not exists', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(invitee);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.onCall(0).resolves(undefined);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.createDirectMessageRoom.resolves('externalRoomId');
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
				inviteeUsernameOnly: 'true',
			});
			const roomResult = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, invitee]);

			sinon.assert.calledWith(bridge.createDirectMessageRoom, 'externalInviterId', ['externalInviteeId']);
			sinon.assert.calledWith(roomAdapter.createFederatedRoomForDirectMessage, roomResult);
		});

		it('should throw an error if the federated room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(undefined);
			bridge.createDirectMessageRoom.resolves('externalRoomId');

			await expect(
				service.createDirectMessageRoomAndInviteUser({
					normalizedInviteeId: 'normalizedInviteeId',
					rawInviteeId: 'rawInviteeId',
					internalInviterId: 'internalInviterId',
					internalRoomId: 'internalRoomId',
					inviteeUsernameOnly: 'true',
				}),
			).to.be.rejectedWith('Could not find room id for users: hexString hexString');
		});

		it('should create the invitee user on the proxy home server if the invitee is from the same homeserver', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(invitee);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves(undefined);

			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			sinon.assert.calledWith(bridge.createUser, 'inviteeUsernameOnly', 'normalizedInviteeId', 'localDomain');
		});

		it('should invite and join the user to the room in the proxy home server if the invitee is from the same homeserver', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(invitee);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves(undefined);

			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			sinon.assert.calledWith(bridge.inviteToRoom, 'externalRoomId', 'externalInviterId', 'externalInviteeId');
			sinon.assert.calledWith(bridge.joinRoom, 'externalRoomId', 'externalInviteeId');
		});

		it('should NOT invite any user externally if the user is not from the same home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			sinon.assert.notCalled(bridge.inviteToRoom);
			sinon.assert.notCalled(bridge.createUser);
			sinon.assert.notCalled(bridge.joinRoom);
		});

		it('should always add the user to the internal room', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			sinon.assert.calledWith(roomAdapter.addUserToRoom, room, user, user);
		});
	});

	describe('#afterUserLeaveRoom()', () => {
		it('should not remove the user from the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.afterUserLeaveRoom({} as any);

			sinon.assert.notCalled(bridge.leaveRoom);
		});

		it('should not remove the user from the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterUserLeaveRoom({} as any);

			sinon.assert.notCalled(bridge.leaveRoom);
		});

		it('should not remove the user from the room if the  who executed the action is not from the same homeserver', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterUserLeaveRoom({} as any);

			sinon.assert.notCalled(bridge.leaveRoom);
		});

		it('should remove the user from the room if the room and the user exists, and is from the same homeserver', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterUserLeaveRoom({} as any);

			sinon.assert.calledWith(bridge.leaveRoom, room.getExternalId(), user.getExternalId());
		});
	});

	describe('#onUserRemovedFromRoom()', () => {
		it('should not kick the user from the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			sinon.assert.notCalled(bridge.kickUserFromRoom);
		});

		it('should not kick the user from the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			sinon.assert.notCalled(bridge.kickUserFromRoom);
		});

		it('should not kick the user from the room if the user who executed the action does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves({});
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			sinon.assert.notCalled(bridge.kickUserFromRoom);
		});

		it('should not kick the user from the room if the user who executed the action is not from the same homeserver', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves({});
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			sinon.assert.notCalled(bridge.kickUserFromRoom);
		});

		it('should remove the user from the room if the room, user and the user who executed the action exists, and is from the same homeserver', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.onUserRemovedFromRoom({} as any);

			sinon.assert.calledWith(bridge.kickUserFromRoom, room.getExternalId(), user.getExternalId(), user.getExternalId());
		});
	});

	describe('#sendExternalMessage()', () => {
		it('should throw an error if the sender does not exists ', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);

			await expect(service.sendExternalMessage({ internalSenderId: 'internalSenderId' } as any)).to.be.rejectedWith(
				'Could not find user id for internalSenderId',
			);
		});

		it('should throw an error if the room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({});
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);

			await expect(service.sendExternalMessage({ internalRoomId: 'internalRoomId' } as any)).to.be.rejectedWith(
				'Could not find room id for internalRoomId',
			);
		});

		it('should NOT send any message if the message was already sent through federation', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({});
			roomAdapter.getFederatedRoomByInternalId.resolves({});

			await service.sendExternalMessage({ internalRoomId: 'internalRoomId', message: { federation: { eventId: 'eventId' } } } as any);

			sinon.assert.notCalled(sendMessageStub);
			sinon.assert.notCalled(sendQuoteMessageStub);
		});

		it('should send the message through the bridge', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.sendExternalMessage({ message: { msg: 'text' } } as any);

			sinon.assert.calledWith(sendMessageStub, room.getExternalId(), user.getExternalId(), { msg: 'text' });
		});

		describe('Quoting messages', () => {
			it('should NOT send a quote message if the current attachment does not have a valid message_link (with a valid msg to reply to)', async () => {
				userAdapter.getFederatedUserByInternalId.resolves({});
				roomAdapter.getFederatedRoomByInternalId.resolves({});

				await service.sendExternalMessage({
					internalRoomId: 'internalRoomId',
					message: { attachments: [{ message_link: 'http://localhost:3000/group/1' }] },
				} as any);

				sinon.assert.notCalled(sendMessageStub);
				sinon.assert.notCalled(sendQuoteMessageStub);
			});

			it('should send a quote message if the current attachment is valid', async () => {
				const user = FederatedUser.createInstance('externalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: true,
				});
				const originalSender = FederatedUser.createInstance('originalSenderExternalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: true,
				});
				const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
				userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
				userAdapter.getFederatedUserByInternalId.onSecondCall().resolves(originalSender);
				roomAdapter.getFederatedRoomByInternalId.resolves(room);
				messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } });
				const message = {
					_id: '_id',
					msg: 'message',
					attachments: [{ message_link: 'http://localhost:3000/group/1?msg=1' }],
				};
				await service.sendExternalMessage({
					internalRoomId: 'internalRoomId',
					message,
				} as any);

				expect(sendQuoteMessageStub.calledWith(room.getExternalId(), user.getExternalId(), message, { federation: { eventId: 'eventId' } }))
					.to.be.true;
				sinon.assert.notCalled(sendMessageStub);
			});
		});
	});

	describe('#afterMessageDeleted()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should not delete the message remotely if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.afterMessageDeleted({ msg: 'msg', u: { _id: 'id' } } as any, 'internalRoomId');

			sinon.assert.notCalled(bridge.redactEvent);
		});

		it('should not delete the message remotely if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterMessageDeleted({ msg: 'msg', u: { _id: 'id' } } as any, 'internalRoomId');

			sinon.assert.notCalled(bridge.redactEvent);
		});

		it('should not delete the message remotely if the message is not an external one', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageDeleted({ msg: 'msg', u: { _id: 'id' } } as any, 'internalRoomId');

			sinon.assert.notCalled(bridge.redactEvent);
		});

		it('should not delete the message remotely if the message was already deleted (it was just updated to keep the chat history)', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);

			const internalMessage = createFakeMessage({
				msg: 'msg',
				federation: { eventId: 'id' },
				editedAt: faker.date.recent(),
				editedBy: createFakeUser(),
				t: 'rm',
				u: createFakeUser({
					username: faker.internet.userName(),
					name: faker.person.fullName(),
				}) as any,
			});

			await service.afterMessageDeleted(internalMessage, 'internalRoomId');

			sinon.assert.notCalled(bridge.redactEvent);
		});

		it('should not delete the message remotely if the user is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageDeleted(
				{
					msg: 'msg',
					federationEventId: 'id',
					u: { _id: 'id' },
				} as any,
				'internalRoomId',
			);

			sinon.assert.notCalled(bridge.redactEvent);
		});

		it('should delete the message remotely', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageDeleted(
				{
					msg: 'msg',
					federation: { eventId: 'federationEventId' },
					u: { _id: 'id' },
				} as any,
				'internalRoomId',
			);

			sinon.assert.calledWith(bridge.redactEvent, room.getExternalId(), user.getExternalId(), 'federationEventId');
		});
	});

	describe('#afterMessageUpdated()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should not update the message remotely if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.afterMessageUpdated({ msg: 'msg' } as any, 'internalRoomId', 'internalUserId');

			sinon.assert.notCalled(bridge.updateMessage);
		});

		it('should not update the message remotely if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterMessageUpdated({ msg: 'msg' } as any, 'internalRoomId', 'internalUserId');

			sinon.assert.notCalled(bridge.updateMessage);
		});

		it('should not update the message remotely if the message is not an external one', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageUpdated({ msg: 'msg' } as any, 'internalRoomId', 'internalUserId');

			sinon.assert.notCalled(bridge.updateMessage);
		});

		it('should not update the message remotely if it was updated not by the sender', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageUpdated(
				{ msg: 'msg', federation: { eventId: 'federationEventId' }, u: { _id: 'sender' } } as any,
				'internalRoomId',
				'internalUserId',
			);

			sinon.assert.notCalled(bridge.updateMessage);
		});

		it('should not update the message remotely if the user is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);

			const internalMessage = createFakeMessage({
				msg: 'msg',
				federation: { eventId: 'federationEventId' },
				editedAt: faker.date.recent(),
				editedBy: createFakeUser(),
				u: createFakeUser({
					username: faker.internet.userName(),
					name: faker.person.fullName(),
				}),
			});

			await service.afterMessageUpdated(internalMessage, 'internalRoomId', 'internalUserId');

			sinon.assert.notCalled(bridge.updateMessage);
		});

		it('should update the message remotely', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);

			const internalMessage = createFakeMessage({
				msg: 'msg',
				federation: { eventId: 'federationEventId' },
				editedAt: faker.date.recent(),
				editedBy: createFakeUser(),
				u: createFakeUser({
					_id: 'internalUserId',
					username: faker.internet.userName(),
					name: faker.person.fullName(),
				}),
			});

			await service.afterMessageUpdated(internalMessage, 'internalRoomId', 'internalUserId');

			sinon.assert.calledWith(bridge.updateMessage, room.getExternalId(), user.getExternalId(), 'federationEventId', 'msg');
		});
	});

	describe('#onRoomOwnerAdded()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT set the user power level in the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the target user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves(undefined);

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should throw an error if the user is trying to make the target user (not himself) an owner, but he is not an owner', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves([]);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });

			await expect(service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId')).to.be.rejectedWith(
				'Federation_Matrix_not_allowed_to_change_owner',
			);

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user is not from the same homeserver', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should set the user power level in the room when the user is an owner giving an ownership to someone else', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId
				.onSecondCall()
				.resolves({ getInternalId: () => 'internalTargetUserId', getExternalId: () => 'externalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				'externalTargetUserId',
				MATRIX_POWER_LEVELS.ADMIN,
			);
		});

		it('should set the user power level in the room when the user is an owner giving an ownership to himself', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				user.getExternalId(),
				MATRIX_POWER_LEVELS.ADMIN,
			);
		});

		it('should roll back the role change if some error happens in the set power level remotely', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.rejects();

			await service.onRoomOwnerAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(roomAdapter.applyRoomRolesToUser, {
				federatedRoom: room,
				targetFederatedUser: user,
				fromUser: user,
				rolesToAdd: [],
				rolesToRemove: ['owner'],
				notifyChannel: false,
			});
			sinon.assert.calledWith(
				notificationsAdapter.notifyWithEphemeralMessage,
				'Federation_Matrix_error_applying_room_roles',
				user.getInternalId(),
				room.getInternalId(),
			);
		});
	});

	describe('#onRoomOwnerRemoved()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT set the user power level in the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);

			await service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);

			await service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the target user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves(undefined);

			await service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should throw an error if the user is trying to make the target user (not himself) an owner, but he is not an owner', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves([]);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });

			await expect(service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId')).to.be.rejectedWith(
				'Federation_Matrix_not_allowed_to_change_owner',
			);

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user is not from the same homeserver', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should set the user power level in the room when everything is correct', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				user.getExternalId(),
				MATRIX_POWER_LEVELS.USER,
			);
		});

		it('should roll back the role change if some error happens in the set power level remotely', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.rejects();

			await service.onRoomOwnerRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(roomAdapter.applyRoomRolesToUser, {
				federatedRoom: room,
				targetFederatedUser: user,
				fromUser: user,
				rolesToAdd: ['owner'],
				rolesToRemove: [],
				notifyChannel: false,
			});
			sinon.assert.calledWith(
				notificationsAdapter.notifyWithEphemeralMessage,
				'Federation_Matrix_error_applying_room_roles',
				user.getInternalId(),
				room.getInternalId(),
			);
		});
	});

	describe('#onRoomModeratorAdded()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT set the user power level in the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the target user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves(undefined);

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should throw an error if the user is trying to make the target user (not himself) an owner, but he is not an owner nor a moderator', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves([]);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });

			await expect(service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId')).to.be.rejectedWith(
				'Federation_Matrix_not_allowed_to_change_moderator',
			);

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user is not from the same homeserver', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should set the user power level in the room when the user is an owner giving an ownership to someone else', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId
				.onSecondCall()
				.resolves({ getInternalId: () => 'internalTargetUserId', getExternalId: () => 'externalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				'externalTargetUserId',
				MATRIX_POWER_LEVELS.MODERATOR,
			);
		});

		it('should set the user power level in the room when the user is a moderator giving an ownership to someone else', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['moderator']);
			userAdapter.getFederatedUserByInternalId
				.onSecondCall()
				.resolves({ getInternalId: () => 'internalTargetUserId', getExternalId: () => 'externalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				'externalTargetUserId',
				MATRIX_POWER_LEVELS.MODERATOR,
			);
		});

		it('should set the user power level in the room when the user is an owner giving an ownership to himself', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				user.getExternalId(),
				MATRIX_POWER_LEVELS.MODERATOR,
			);
		});

		it('should roll back the role change if some error happens in the set power level remotely', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.rejects();

			await service.onRoomModeratorAdded('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(roomAdapter.applyRoomRolesToUser, {
				federatedRoom: room,
				targetFederatedUser: user,
				fromUser: user,
				rolesToAdd: [],
				rolesToRemove: ['moderator'],
				notifyChannel: false,
			});
			sinon.assert.calledWith(
				notificationsAdapter.notifyWithEphemeralMessage,
				'Federation_Matrix_error_applying_room_roles',
				user.getInternalId(),
				room.getInternalId(),
			);
		});
	});

	describe('#onRoomModeratorRemoved()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT set the user power level in the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);

			await service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);

			await service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the target user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves(undefined);

			await service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should throw an error if the user is trying to make the target user (not himself) an owner, but he is not an owner nor a moderator', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves([]);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });

			await expect(service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId')).to.be.rejectedWith(
				'Federation_Matrix_not_allowed_to_change_moderator',
			);

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should NOT set the user power level in the room if the user is not from the same homeserver', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId.onSecondCall().resolves({ getInternalId: () => 'internalTargetUserId' });
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.notCalled(bridge.setRoomPowerLevels);
		});

		it('should set the user power level in the room when everything is correct', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.resolves();

			await service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(
				bridge.setRoomPowerLevels,
				room.getExternalId(),
				user.getExternalId(),
				user.getExternalId(),
				MATRIX_POWER_LEVELS.USER,
			);
		});

		it('should roll back the role change if some error happens in the set power level remotely', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.setRoomPowerLevels.rejects();

			await service.onRoomModeratorRemoved('internalUserId', 'internalTargetUserId', 'internalRoomId');

			sinon.assert.calledWith(roomAdapter.applyRoomRolesToUser, {
				federatedRoom: room,
				targetFederatedUser: user,
				fromUser: user,
				rolesToAdd: ['moderator'],
				rolesToRemove: [],
				notifyChannel: false,
			});
			sinon.assert.calledWith(
				notificationsAdapter.notifyWithEphemeralMessage,
				'Federation_Matrix_error_applying_room_roles',
				user.getInternalId(),
				room.getInternalId(),
			);
		});
	});

	describe('#afterRoomNameChanged()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should not change the room remotely if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.afterRoomNameChanged('internalRoomId', 'internalRoomName');

			expect(bridge.setRoomName.called).to.be.false;
			expect(bridge.getRoomName.called).to.be.false;
		});

		it('should not change the room remotely if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterRoomNameChanged('internalRoomId', 'internalRoomName');

			expect(bridge.setRoomName.called).to.be.false;
			expect(bridge.getRoomName.called).to.be.false;
		});

		it('should not change the room remotely if the room is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterRoomNameChanged('internalRoomId', 'internalRoomName');

			expect(bridge.setRoomName.called).to.be.false;
			expect(bridge.getRoomName.called).to.be.false;
		});

		it('should not change the room remotely if the name is equal to the current name', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.getRoomName.resolves('externalRoomName');
			await service.afterRoomNameChanged('internalRoomId', 'internalRoomName');

			expect(bridge.setRoomName.called).to.be.false;
		});

		it('should change the room name remotely if its different the current one', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.getRoomName.resolves('currentRoomName');
			await service.afterRoomNameChanged('internalRoomId', 'internalRoomName');

			expect(bridge.setRoomName.calledWith(room.getExternalId(), user.getExternalId(), 'internalRoomName')).to.be.true;
		});
	});

	describe('#afterRoomTopicChanged()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should not change the room remotely if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.afterRoomTopicChanged('internalRoomId', 'internalRoomTopic');

			expect(bridge.setRoomTopic.called).to.be.false;
			expect(bridge.getRoomTopic.called).to.be.false;
		});

		it('should not change the room remotely if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterRoomTopicChanged('internalRoomId', 'internalRoomTopic');

			expect(bridge.setRoomTopic.called).to.be.false;
			expect(bridge.getRoomTopic.called).to.be.false;
		});

		it('should not change the room remotely if the room is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterRoomTopicChanged('internalRoomId', 'internalRoomTopic');

			expect(bridge.setRoomTopic.called).to.be.false;
			expect(bridge.getRoomTopic.called).to.be.false;
		});

		it('should not change the room remotely if the topic is equal to the current topic', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.getRoomTopic.resolves('internalRoomTopic');
			room.changeRoomTopic('internalRoomTopic');
			await service.afterRoomTopicChanged('internalRoomId', 'internalRoomTopic');

			expect(bridge.setRoomTopic.called).to.be.false;
		});

		it('should change the room topic remotely if its different the current one', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.getRoomTopic.resolves('currentRoomTopic');
			await service.afterRoomTopicChanged('internalRoomId', 'internalRoomTopic');

			expect(bridge.setRoomTopic.calledWith(room.getExternalId(), user.getExternalId(), 'internalRoomTopic')).to.be.true;
		});
	});

	describe('#onRoomCreated()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT create the inviter user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.onRoomCreated({ invitees } as any);

			expect(bridge.createUser.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the inviter user both externally and internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.createUser.resolves('externalInviterId');
			await service.onRoomCreated({ invitees } as any);

			const inviter = FederatedUser.createInstance('externalInviterId', {
				name: 'name',
				username: 'username',
				existsOnlyOnProxyServer: true,
			});
			expect(bridge.createUser.calledWith('username', 'name', 'localDomain')).to.be.true;
			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
		});

		it('should throw an error if the inviter user was not found', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);

			await expect(service.onRoomCreated({ invitees, internalInviterId: 'internalInviterId' } as any)).to.be.rejectedWith(
				'User with internalId internalInviterId not found',
			);
		});

		it('should throw an error if the internal room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getInternalRoomById.resolves(undefined);
			await expect(
				service.onRoomCreated({ invitees, internalInviterId: 'internalInviterId', internalRoomId: 'internalRoomId' } as any),
			).to.be.rejectedWith('Room with internalId internalRoomId not found');
		});

		it('should create the room in the proxy home server and update it locally', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getInternalRoomById.resolves({ name: 'name', t: RoomType.CHANNEL, topic: 'topic', _id: '_id' } as any);
			roomAdapter.getFederatedRoomByInternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.createRoom.resolves('externalRoomId');
			await service.onRoomCreated({ invitees, internalInviterId: 'internalInviterId', internalRoomId: 'internalRoomId' } as any);

			expect(bridge.createRoom.calledWith(user.getExternalId(), RoomType.CHANNEL, 'name', 'topic')).to.be.true;
			expect(roomAdapter.updateFederatedRoomByInternalRoomId.calledWith('_id', 'externalRoomId')).to.be.true;
		});

		it('should NOT create the invitee user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.onRoomCreated({ internalInviterId: 'internalInviterId', invitees } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee user internally if it does not exists (using the username only if it is from the proxy home server)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');

			await service.onRoomCreated({ internalInviterId: 'internalInviterId', invitees } as any);

			const invitee = FederatedUser.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].inviteeUsernameOnly,
				username: invitees[0].inviteeUsernameOnly,
				existsOnlyOnProxyServer: true,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should create the invitee user internally if it does not exists (using the normalized invite id if it is NOT from the proxy home server)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomCreated({ internalInviterId: 'internalInviterId', invitees } as any);

			const invitee = FederatedUser.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].normalizedInviteeId,
				username: invitees[0].normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should throw an error if the invitee user was not found', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);

			await expect(service.onRoomCreated({ invitees, internalInviterId: 'internalInviterId' } as any)).to.be.rejectedWith(
				`User with internalUsername ${invitees[0].normalizedInviteeId} not found`,
			);
		});

		it('should create the invitee user on the proxy home server if the invitee is from the same home server AND it does not exists yet', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves(undefined);

			await service.onRoomCreated({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.createUser.calledWith(invitees[0].inviteeUsernameOnly, user.getName(), 'localDomain')).to.be.true;
		});

		it('should NOT create the invitee user on the proxy home server if the invitee is from the same home server but it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves({});

			await service.onRoomCreated({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should NOT create the invitee user on the proxy home server if its not from the same home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomCreated({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should always invite the invitee user to the room', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);

			await service.onRoomCreated({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.inviteToRoom.calledWith(room.getExternalId(), user.getExternalId(), invitee.getExternalId())).to.be.true;
		});

		it('should automatically join the invitee if he/she is from the proxy homeserver', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			bridge.extractHomeserverOrigin.returns('localDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);

			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.joinRoom.calledWith(room.getExternalId(), invitee.getExternalId())).to.be.true;
		});

		it('should NOT automatically join the invitee if he/she is NOT from the proxy homeserver', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			bridge.extractHomeserverOrigin.returns('externalDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);

			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0], ahahha: 'ahha' } as any);

			expect(bridge.joinRoom.called).to.be.false;
		});
	});

	describe('#beforeAddUserToARoom()', () => {
		const federatedUser = FederatedUser.createInstance('externalInviteeId', {
			name: 'normalizedInviteeId',
			username: 'normalizedInviteeId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', federatedUser, RoomType.CHANNEL, 'externalRoomName');
		const validParams = {
			invitees: [
				...invitees,
				{
					inviteeUsernameOnly: 'marcos.defendiNotToBeInvited',
					normalizedInviteeId: 'marcos.defendi:matrix.comNotToBeInvited',
					rawInviteeId: '@marcos.defendi:matrix.comNotToBeInvited',
				},
			],
		} as any;

		it('should not create the invitee locally if the inviter was provided but it does not exists', async () => {
			const createUsersLocallyOnlySpy = sinon.spy(service, 'createUsersLocallyOnly');
			userAdapter.getFederatedUserByInternalId.resolves(undefined);

			await service.beforeAddUserToARoom({
				...validParams,
				internalInviter: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});
			expect(createUsersLocallyOnlySpy.called).to.be.false;
		});

		it('should not create the invitee locally if the inviter was provided but the room does not exists', async () => {
			const createUsersLocallyOnlySpy = sinon.spy(service, 'createUsersLocallyOnly');
			userAdapter.getFederatedUserByInternalId.resolves(federatedUser);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);

			await service.beforeAddUserToARoom({
				...validParams,
				internalInviter: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});
			expect(createUsersLocallyOnlySpy.called).to.be.false;
		});

		it('should throw an error if the inviter was provided and he/she is not neither owner, moderator or the room creator', async () => {
			const createUsersLocallyOnlySpy = sinon.spy(service, 'createUsersLocallyOnly');
			userAdapter.getFederatedUserByInternalId.resolves({ getInternalId: () => 'differentId' });
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves([]);

			await expect(
				service.beforeAddUserToARoom({
					...validParams,
					internalInviter: 'internalInviterId',
					internalRoomId: 'internalRoomId',
				}),
			).to.be.rejectedWith('You are not allowed to add users to this room');
			expect(createUsersLocallyOnlySpy.called).to.be.false;
		});

		it('should create the user locally if the inviter was provided and he/she is an owner', async () => {
			const createUsersLocallyOnlySpy = sinon.spy(service, 'createUsersLocallyOnly');
			userAdapter.getFederatedUserByInternalId.resolves({ getInternalId: () => 'differentId' });
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['owner']);

			await service.beforeAddUserToARoom({
				...validParams,
				internalInviter: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			expect(createUsersLocallyOnlySpy.calledWith(validParams.invitees)).to.be.true;
		});

		it('should create the user locally if the inviter was provided and he/she is an moderator', async () => {
			const createUsersLocallyOnlySpy = sinon.spy(service, 'createUsersLocallyOnly');
			userAdapter.getFederatedUserByInternalId.resolves({ getInternalId: () => 'differentId' });
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves(['moderator']);

			await service.beforeAddUserToARoom({
				...validParams,
				internalInviter: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			expect(createUsersLocallyOnlySpy.calledWith(validParams.invitees)).to.be.true;
		});

		it('should create the user locally if the inviter was provided and he/she is the room creator', async () => {
			const createUsersLocallyOnlySpy = sinon.spy(service, 'createUsersLocallyOnly');
			userAdapter.getFederatedUserByInternalId.resolves(federatedUser);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			roomAdapter.getInternalRoomRolesByUserId.resolves([]);

			await service.beforeAddUserToARoom({
				...validParams,
				internalInviter: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			});

			expect(createUsersLocallyOnlySpy.calledWith(validParams.invitees)).to.be.true;
		});

		it('should create the invitee locally for each external user', async () => {
			const avatarSpy = sinon.spy(service, 'updateUserAvatarInternally');
			const displayNameSpy = sinon.spy(service, 'updateUserDisplayNameInternally');

			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: 'avatarUrl', displayName: 'displayName' });
			userAdapter.getFederatedUserByExternalId.resolves(federatedUser);

			await service.beforeAddUserToARoom(validParams);

			const invitee = FederatedUser.createLocalInstanceOnly({
				name: 'displayName',
				username: invitees[0].normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			expect(userAdapter.createLocalUser.calledOnceWithExactly(invitee)).to.be.true;
			expect(avatarSpy.calledWith(federatedUser, 'avatarUrl')).to.be.true;
			expect(displayNameSpy.calledWith(federatedUser, 'displayName')).to.be.true;
		});

		it('should NOT update the avatar nor the display name if both does not exists', async () => {
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: '', displayName: '' });
			userAdapter.getFederatedUserByExternalId.resolves(federatedUser);

			await service.beforeAddUserToARoom(validParams);

			expect(userAdapter.setAvatar.called).to.be.false;
			expect(userAdapter.updateFederationAvatar.called).to.be.false;
			expect(userAdapter.updateRealName.called).to.be.false;
		});

		it('should NOT update the avatar url nor the display name if the user is from the local home server', async () => {
			userAdapter.getFederatedUserByExternalId.resolves(
				FederatedUser.createInstance('externalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: true,
				}),
			);
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: 'avatarUrl', displayName: 'displayName' });

			await service.beforeAddUserToARoom(validParams);

			expect(userAdapter.setAvatar.called).to.be.false;
			expect(userAdapter.updateFederationAvatar.called).to.be.false;
			expect(userAdapter.updateRealName.called).to.be.false;
		});

		it('should NOT update the avatar url if the url received in the event is equal to the one already used', async () => {
			const existsOnlyOnProxyServer = false;
			userAdapter.getFederatedUserByExternalId.resolves(
				FederatedUser.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
					federation: {
						avatarUrl: 'avatarUrl',
					},
				} as any),
			);
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: 'avatarUrl', displayName: 'displayName' });

			await service.beforeAddUserToARoom(validParams);

			expect(userAdapter.setAvatar.called).to.be.false;
			expect(userAdapter.updateFederationAvatar.called).to.be.false;
		});

		it('should call the functions to update the avatar internally correctly', async () => {
			const existsOnlyOnProxyServer = false;
			const userAvatar = FederatedUser.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
				federation: {
					avatarUrl: 'currentAvatarUrl',
				},
				_id: 'userId',
			} as any);
			userAdapter.getFederatedUserByExternalId.resolves(userAvatar);
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: 'avatarUrl', displayName: 'displayName' });

			await service.beforeAddUserToARoom(validParams);

			expect(userAdapter.setAvatar.calledWith(userAvatar, 'toHttpUrl')).to.be.true;
			expect(userAdapter.updateFederationAvatar.calledWith(userAvatar.getInternalId(), 'avatarUrl')).to.be.true;
		});

		it('should NOT update the display name if the name received in the event is equal to the one already used', async () => {
			const existsOnlyOnProxyServer = false;
			userAdapter.getFederatedUserByExternalId.resolves(
				FederatedUser.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
					name: 'displayName',
				} as any),
			);
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: '', displayName: 'displayName' });

			await service.beforeAddUserToARoom(validParams);

			expect(userAdapter.setAvatar.called).to.be.false;
			expect(userAdapter.updateFederationAvatar.called).to.be.false;
			expect(userAdapter.updateRealName.called).to.be.false;
		});

		it('should call the functions to update the display name internally correctly', async () => {
			const existsOnlyOnProxyServer = false;
			const user = FederatedUser.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
				_id: 'userId',
				name: 'currentName',
			} as any);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			bridge.getUserProfileInformation.resolves({ avatarUrl: '', displayName: 'displayName' });

			await service.beforeAddUserToARoom(validParams);

			expect(userAdapter.setAvatar.called).to.be.false;
			expect(userAdapter.updateFederationAvatar.called).to.be.false;
			expect(userAdapter.updateRealName.calledWith(user.getInternalReference(), 'displayName')).to.be.true;
		});
	});

	describe('#onUsersAddedToARoom()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should throw an error if the room does not exists', async () => {
			roomAdapter.getInternalRoomById.resolves(undefined);
			await expect(
				service.onUsersAddedToARoom({ invitees, internalInviterId: 'internalInviterId', internalRoomId: 'internalRoomId' } as any),
			).to.be.rejectedWith('Could not find the room to invite. RoomId: internalRoomId');
		});

		it('should NOT create the inviter user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.onUsersAddedToARoom({ internalInviterId: 'internalInviterId', invitees } as any);

			expect(bridge.createUser.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should throw an error if the inviter user was not found and the user is not joining by himself', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);

			await expect(service.onUsersAddedToARoom({ invitees, internalInviterId: 'internalInviterId' } as any)).to.be.rejectedWith(
				'User with internalId internalInviterId not found',
			);
		});

		it('should NOT throw an error if the inviter user was not found but the user is joining by himself (which means there is no inviter)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);

			await expect(service.onUsersAddedToARoom({ invitees, internalInviterId: '' } as any)).not.to.be.rejectedWith(
				'User with internalId internalInviterId not found',
			);
		});

		it('should NOT create the invitee user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.onUsersAddedToARoom({ internalInviterId: 'internalInviterId', invitees } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee user internally if it does not exists (using the username only if it is from the proxy home server)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');

			await service.onUsersAddedToARoom({ internalInviterId: 'internalInviterId', invitees } as any);

			const invitee = FederatedUser.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].inviteeUsernameOnly,
				username: invitees[0].inviteeUsernameOnly,
				existsOnlyOnProxyServer: true,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should create the invitee user internally if it does not exists (using the normalized invite id if it is NOT from the proxy home server)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onUsersAddedToARoom({ internalInviterId: 'internalInviterId', invitees } as any);

			const invitee = FederatedUser.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].normalizedInviteeId,
				username: invitees[0].normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should throw an error if the invitee user was not found', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);

			await expect(service.onUsersAddedToARoom({ invitees, internalInviterId: 'internalInviterId' } as any)).to.be.rejectedWith(
				`User with internalUsername ${invitees[0].normalizedInviteeId} not found`,
			);
		});

		it('should create the invitee user on the proxy home server if the invitee is from the same home server AND it does not exists yet', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves(undefined);

			await service.onUsersAddedToARoom({
				internalInviterId: 'internalInviterId',
				invitees,
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.createUser.calledWith(invitees[0].inviteeUsernameOnly, user.getName(), 'localDomain')).to.be.true;
		});

		it('should NOT create the invitee user on the proxy home server if the invitee is from the same home server but it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves({});

			await service.onUsersAddedToARoom({
				internalInviterId: 'internalInviterId',
				invitees,
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should NOT create the invitee user on the proxy home server if its not from the same home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onUsersAddedToARoom({
				internalInviterId: 'internalInviterId',
				invitees,
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should NOT auto-join the user to the room if the user is auto-joining the room but he is NOT from the same homeserver', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onUsersAddedToARoom({
				internalInviterId: '',
				invitees,
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.joinRoom.called).to.be.false;
			expect(bridge.inviteToRoom.called).to.be.false;
		});

		it('should auto-join the user to the room if the user is auto-joining the room', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');

			await service.onUsersAddedToARoom({
				internalInviterId: '',
				invitees,
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.joinRoom.calledWith(room.getExternalId(), invitee.getExternalId())).to.be.true;
			expect(bridge.inviteToRoom.called).to.be.false;
		});

		it('should invite the user to the user only if the user is NOT auto-joining the room', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: true,
			});
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);

			await service.onUsersAddedToARoom({
				internalInviterId: 'internalInviterId',
				invitees,
				internalRoomId: 'internalRoomId',
				...invitees[0],
			} as any);

			expect(bridge.inviteToRoom.calledWith(room.getExternalId(), user.getExternalId(), invitee.getExternalId())).to.be.true;
		});
	});

	describe('#searchPublicRooms()', () => {
		it('should throw an error if the federation is disabled', async () => {
			settingsAdapter.isFederationEnabled.returns(false);
			await expect(service.searchPublicRooms({} as any)).to.be.rejectedWith('Federation is disabled');
		});

		it('should call the bridge search public rooms with the provided server name', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			await service.searchPublicRooms({ serverName: 'serverName' } as any);
			expect(
				bridge.searchPublicRooms.calledWith({
					serverName: 'serverName',
					roomName: undefined,
					limit: undefined,
					pageToken: undefined,
				}),
			).to.be.true;
		});

		it('should call the bridge search public rooms with the proxy home server name when the server name was not provided', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			await service.searchPublicRooms({} as any);
			expect(
				bridge.searchPublicRooms.calledWith({
					serverName: 'localDomain',
					roomName: undefined,
					limit: undefined,
					pageToken: undefined,
				}),
			).to.be.true;
		});

		it('should return the Matrix public rooms for the server', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.returns('100');
			bridge.searchPublicRooms.resolves({
				chunk: [
					{
						room_id: 'externalRoomId',
						name: 'externalRoomName',
						num_joined_members: 1,
						topic: 'externalRoomTopic',
						canonical_alias: 'externalRoomAlias',
						join_rule: 'public',
					},
					{
						room_id: 'externalRoomId2',
						name: 'externalRoomName2',
						num_joined_members: 1,
						topic: 'externalRoomTopic2',
						canonical_alias: 'externalRoomAlias2',
						join_rule: 'public',
					},
				],
				next_batch: 'next_batch',
				prev_batch: 'prev_batch',
				total_room_count_estimate: 10000,
			});
			const result = await service.searchPublicRooms({} as any);

			expect(result).to.be.eql({
				rooms: [
					{
						id: 'externalRoomId',
						name: 'externalRoomName',
						joinedMembers: 1,
						topic: 'externalRoomTopic',
						canonicalAlias: 'externalRoomAlias',
						canJoin: true,
						pageToken: undefined,
					},
					{
						id: 'externalRoomId2',
						name: 'externalRoomName2',
						joinedMembers: 1,
						topic: 'externalRoomTopic2',
						canonicalAlias: 'externalRoomAlias2',
						canJoin: true,
						pageToken: undefined,
					},
				],
				count: 2,
				total: 10000,
				nextPageToken: 'next_batch',
				prevPageToken: 'prev_batch',
			});
		});

		it('should return the Matrix public rooms for the server filtering all the rooms that is not possible to join', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.returns('100');
			bridge.searchPublicRooms.resolves({
				chunk: [
					{
						room_id: 'externalRoomId',
						name: 'externalRoomName',
						num_joined_members: 1,
						topic: 'externalRoomTopic',
						canonical_alias: 'externalRoomAlias',
						join_rule: 'public',
					},
					{
						room_id: 'externalRoomId2',
						name: 'externalRoomName2',
						num_joined_members: 1,
						topic: 'externalRoomTopic2',
						canonical_alias: 'externalRoomAlias2',
						join_rule: 'knock',
					},
				],
				next_batch: 'next_batch',
				prev_batch: 'prev_batch',
				total_room_count_estimate: 10000,
			});
			const result = await service.searchPublicRooms({} as any);

			expect(result).to.be.eql({
				rooms: [
					{
						id: 'externalRoomId',
						name: 'externalRoomName',
						joinedMembers: 1,
						topic: 'externalRoomTopic',
						canonicalAlias: 'externalRoomAlias',
						canJoin: true,
						pageToken: undefined,
					},
				],
				count: 2,
				total: 10000,
				nextPageToken: 'next_batch',
				prevPageToken: 'prev_batch',
			});
		});

		it('should return the Matrix public rooms for the server filtering all the rooms that is not possible to join (all of the as canJoin = false, since they have more users than the allowed)', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.returns('100');
			bridge.searchPublicRooms.resolves({
				chunk: [
					{
						room_id: 'externalRoomId',
						name: 'externalRoomName',
						num_joined_members: 101,
						topic: 'externalRoomTopic',
						canonical_alias: 'externalRoomAlias',
						join_rule: 'public',
					},
					{
						room_id: 'externalRoomId2',
						name: 'externalRoomName2',
						num_joined_members: 4000,
						topic: 'externalRoomTopic2',
						canonical_alias: 'externalRoomAlias2',
						join_rule: 'knock',
					},
				],
				next_batch: 'next_batch',
				prev_batch: 'prev_batch',
				total_room_count_estimate: 10000,
			});
			const result = await service.searchPublicRooms({} as any);

			expect(result).to.be.eql({
				rooms: [
					{
						id: 'externalRoomId',
						name: 'externalRoomName',
						joinedMembers: 101,
						topic: 'externalRoomTopic',
						canonicalAlias: 'externalRoomAlias',
						canJoin: false,
						pageToken: undefined,
					},
				],
				count: 2,
				total: 10000,
				nextPageToken: 'next_batch',
				prevPageToken: 'prev_batch',
			});
		});

		it('should return the Matrix public rooms for the server including a valid pageToken for each room', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.returns('100');
			bridge.searchPublicRooms.resolves({
				chunk: [
					{
						room_id: 'externalRoomId',
						name: 'externalRoomName',
						num_joined_members: 101,
						topic: 'externalRoomTopic',
						canonical_alias: 'externalRoomAlias',
						join_rule: 'public',
					},
					{
						room_id: 'externalRoomId2',
						name: 'externalRoomName2',
						num_joined_members: 4000,
						topic: 'externalRoomTopic2',
						canonical_alias: 'externalRoomAlias2',
						join_rule: 'knock',
					},
				],
				next_batch: 'next_batch',
				prev_batch: 'prev_batch',
				total_room_count_estimate: 10000,
			});
			const result = await service.searchPublicRooms({ pageToken: 'pageToken' } as any);

			expect(result).to.be.eql({
				rooms: [
					{
						id: 'externalRoomId',
						name: 'externalRoomName',
						joinedMembers: 101,
						topic: 'externalRoomTopic',
						canonicalAlias: 'externalRoomAlias',
						canJoin: false,
						pageToken: 'pageToken',
					},
				],
				count: 2,
				total: 10000,
				nextPageToken: 'next_batch',
				prevPageToken: 'prev_batch',
			});
		});
	});

	describe('#scheduleJoinExternalPublicRoom()', () => {
		it('should throw an error if the federation is disabled', async () => {
			settingsAdapter.isFederationEnabled.returns(false);
			await expect(service.scheduleJoinExternalPublicRoom({} as any)).to.be.rejectedWith('Federation is disabled');
		});

		it('should enqueue a job to join the room', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			const internalUserId = 'internalUserId';
			const externalRoomId = 'externalRoomId';
			const roomName = 'roomName';
			const pageToken = 'pageToken';
			await service.scheduleJoinExternalPublicRoom(internalUserId, externalRoomId, roomName, pageToken);

			expect(
				queueAdapter.enqueueJob.calledOnceWithExactly('federation-enterprise.joinExternalPublicRoom', {
					internalUserId,
					externalRoomId,
					roomName,
					pageToken,
				}),
			);
		});

		describe('#joinExternalPublicRoom()', () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

			it('should throw an error if the federation is disabled', async () => {
				settingsAdapter.isFederationEnabled.returns(false);
				await expect(service.joinExternalPublicRoom({} as any)).to.be.rejectedWith('Federation is disabled');
			});

			it('should throw an error if the user already joined the room', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				roomAdapter.isUserAlreadyJoined.resolves(true);
				await expect(service.joinExternalPublicRoom({} as any)).to.be.rejectedWith('already-joined');
			});

			it('should NOT create an external user if it already exists', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				userAdapter.getFederatedUserByInternalId.resolves(user);
				const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');
				sinon.stub(service, 'isRoomSizeAllowed').returns(true);

				await service.joinExternalPublicRoom({} as any);

				expect(spy.called).to.be.false;
			});

			it('should create an external user if it does not exists', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(undefined);
				userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
				userAdapter.getFederatedUserByInternalId.resolves(user);
				const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');
				sinon.stub(service, 'isRoomSizeAllowed').returns(true);

				await service.joinExternalPublicRoom({ internalUserId: 'internalUserId' } as any);

				expect(spy.calledWith('internalUserId')).to.be.true;
			});

			it('should throw an error if the federated user was not found even after creation', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				userAdapter.getFederatedUserByInternalId.resolves(undefined);
				userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });

				await expect(service.joinExternalPublicRoom({ internalUserId: 'internalUserId' } as any)).to.be.rejectedWith(
					'User with internalId internalUserId not found',
				);
			});

			it('should throw an error if the room the user is trying to join does not exists', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				userAdapter.getFederatedUserByInternalId.resolves(user);
				userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
				bridge.searchPublicRooms.resolves({ chunk: [{ room_id: 'differentId' }] });

				await expect(
					service.joinExternalPublicRoom({ internalUserId: 'internalUserId', externalRoomId: 'externalRoomId' } as any),
				).to.be.rejectedWith("Cannot find the room you're trying to join");
			});

			it('should throw an error if the room the user is trying to join does not exists due to the server was not able to search', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				userAdapter.getFederatedUserByInternalId.resolves(user);
				userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
				bridge.searchPublicRooms.rejects();

				await expect(
					service.joinExternalPublicRoom({ internalUserId: 'internalUserId', externalRoomId: 'externalRoomId' } as any),
				).to.be.rejectedWith("Cannot find the room you're trying to join");
			});

			it('should throw an error if the room the user is trying to join contains more users (its bigger) than the allowed by the setting', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.returns('100');
				userAdapter.getFederatedUserByInternalId.resolves(user);
				userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
				bridge.searchPublicRooms.resolves({ chunk: [{ room_id: 'externalRoomId', num_joined_members: 101 }] });

				await expect(
					service.joinExternalPublicRoom({ internalUserId: 'internalUserId', externalRoomId: 'externalRoomId' } as any),
				).to.be.rejectedWith("Can't join a room bigger than the admin of your workspace has set as the maximum size");
			});

			it('should join the user to the remote room', async () => {
				settingsAdapter.isFederationEnabled.returns(true);
				userAdapter.getFederatedUserByInternalId.resolves(user);
				sinon.stub(service, 'isRoomSizeAllowed').returns(true);

				await service.joinExternalPublicRoom({
					externalRoomId: 'externalRoomId',
					internalUserId: 'internalUserId',
					externalRoomHomeServerName: 'externalRoomHomeServerName',
				} as any);

				expect(bridge.joinRoom.calledWith('externalRoomId', user.getExternalId(), ['externalRoomHomeServerName'])).to.be.true;
			});
		});
	});
});
