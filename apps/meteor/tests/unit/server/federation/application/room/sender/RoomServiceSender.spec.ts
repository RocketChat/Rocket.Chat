import { faker } from '@faker-js/faker';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IEditedMessage, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type * as RoomServiceSenderModule from '../../../../../../../server/services/federation/application/room/sender/RoomServiceSender';
import type * as FederatedRoomModule from '../../../../../../../server/services/federation/domain/FederatedRoom';
import type * as FederatedUserModule from '../../../../../../../server/services/federation/domain/FederatedUser';
import { MATRIX_POWER_LEVELS } from '../../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixPowerLevels';
import { createFakeMessage, createFakeUser } from '../../../../../../mocks/data';

const sendMessageStub = sinon.stub();
const sendQuoteMessageStub = sinon.stub();
const { FederationRoomServiceSender } = proxyquire
	.noCallThru()
	.load<typeof RoomServiceSenderModule>('../../../../../../../server/services/federation/application/room/sender/RoomServiceSender', {
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

const { FederatedUser } = proxyquire
	.noCallThru()
	.load<typeof FederatedUserModule>('../../../../../../../server/services/federation/domain/FederatedUser', {
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
	.load<typeof FederatedRoomModule>('../../../../../../../server/services/federation/domain/FederatedRoom', {
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
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
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
	};

	beforeEach(() => {
		service = new FederationRoomServiceSender(
			roomAdapter as any,
			userAdapter as any,
			fileAdapter as any,
			messageAdapter as any,
			settingsAdapter as any,
			notificationsAdapter as any,
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
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		userAdapter.getInternalUserByUsername.reset();
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
		messageAdapter.getMessageById.reset();
		messageAdapter.setExternalFederationEventOnMessage.reset();
		notificationsAdapter.subscribeToUserTypingEventsOnFederatedRoomId.reset();
		notificationsAdapter.notifyWithEphemeralMessage.reset();
		notificationsAdapter.broadcastUserTypingOnRoom.reset();
		sendMessageStub.reset();
		sendQuoteMessageStub.reset();
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

			const internalMessage = createFakeMessage<IEditedMessage>({
				msg: 'msg',
				federation: { eventId: 'id' },
				editedAt: faker.date.recent(),
				editedBy: createFakeUser(),
				t: 'rm',
				u: createFakeUser<Required<IUser>>({
					username: faker.internet.userName(),
					name: faker.person.fullName(),
				}),
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

			const internalMessage = createFakeMessage<IEditedMessage>({
				msg: 'msg',
				federation: { eventId: 'federationEventId' },
				editedAt: faker.date.recent(),
				editedBy: createFakeUser(),
				u: createFakeUser<Required<IUser>>({
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

			const internalMessage = createFakeMessage<IEditedMessage>({
				msg: 'msg',
				federation: { eventId: 'federationEventId' },
				editedAt: faker.date.recent(),
				editedBy: createFakeUser(),
				u: createFakeUser<Required<IUser>>({
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
});
