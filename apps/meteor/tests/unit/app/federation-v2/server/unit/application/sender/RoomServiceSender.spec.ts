import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const sendMessageStub = sinon.stub();
const sendQuoteMessageStub = sinon.stub();
const { FederationRoomServiceSender } = proxyquire
	.noCallThru()
	.load('../../../../../../../../app/federation-v2/server/application/sender/RoomServiceSender', {
		'mongodb': {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
		'./MessageSenders': {
			getExternalMessageSender: () => ({ sendMessage: sendMessageStub, sendQuoteMessage: sendQuoteMessageStub }),
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/domain/FederatedUser', {
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
	.load('../../../../../../../../app/federation-v2/server/domain/FederatedRoom', {
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
	let service: typeof FederationRoomServiceSender;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		createFederatedRoomForDirectMessage: sinon.stub(),
		getDirectMessageFederatedRoomByUserIds: sinon.stub(),
		addUserToRoom: sinon.stub(),
		createFederatedRoom: sinon.stub(),
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
		messageAdapter.getMessageById.reset();
		messageAdapter.setExternalFederationEventOnMessage.reset();
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

			expect(userAdapter.createFederatedUser.called).to.be.false;
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

			expect(bridge.createUser.calledWith('username', 'name', 'localDomain')).to.be.true;
			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
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

			expect(userAdapter.createFederatedUser.called).to.be.false;
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

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should throw an error when the inviter does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username' } as any);

			await expect(
				service.createDirectMessageRoomAndInviteUser({
					normalizedInviteeId: 'normalizedInviteeId',
					rawInviteeId: 'rawInviteeId',
				} as any),
			).to.be.rejectedWith('Could not find inviter or invitee user');
		});

		it('should throw an error when the invitee does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username' } as any);

			await expect(
				service.createDirectMessageRoomAndInviteUser({
					normalizedInviteeId: 'normalizedInviteeId',
					rawInviteeId: 'rawInviteeId',
				} as any),
			).to.be.rejectedWith('Could not find inviter or invitee user');
		});

		it('should NOT create the room if it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
			} as any);

			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
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
			} as any);
			const roomResult = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, invitee]);

			expect(bridge.createDirectMessageRoom.calledWith('externalInviterId', ['externalInviteeId'])).to.be.true;
			expect(roomAdapter.createFederatedRoomForDirectMessage.calledWith(roomResult)).to.be.true;
		});

		it('should throw an error if the federated room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(undefined);
			bridge.createDirectMessageRoom.resolves('externalRoomId');

			await expect(
				service.createDirectMessageRoomAndInviteUser({
					normalizedInviteeId: 'normalizedInviteeId',
					rawInviteeId: 'rawInviteeId',
				} as any),
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
			} as any);

			expect(bridge.createUser.calledWith('inviteeUsernameOnly', 'normalizedInviteeId', 'localDomain')).to.be.true;
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
			} as any);

			expect(bridge.inviteToRoom.calledWith('externalRoomId', 'externalInviterId', 'externalInviteeId')).to.be.true;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should NOT invite any user externally if the user is not from the same home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(bridge.inviteToRoom.called).to.be.false;
			expect(bridge.createUser.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
		});

		it('should always add the user to the internal room', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getDirectMessageFederatedRoomByUserIds.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(roomAdapter.addUserToRoom.calledWith(room, user, user)).to.be.true;
		});
	});

	describe('#afterUserLeaveRoom()', () => {
		it('should not remove the user from the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.afterUserLeaveRoom({} as any);

			expect(bridge.leaveRoom.called).to.be.false;
		});

		it('should not remove the user from the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterUserLeaveRoom({} as any);

			expect(bridge.leaveRoom.called).to.be.false;
		});

		it('should remove the user from the room if the room and the user exists', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterUserLeaveRoom({} as any);

			expect(bridge.leaveRoom.calledWith(room.getExternalId(), user.getExternalId())).to.be.true;
		});
	});

	describe('#onUserRemovedFromRoom()', () => {
		it('should not kick the user from the room if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			expect(bridge.kickUserFromRoom.called).to.be.false;
		});

		it('should not kick the user from the room if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			expect(bridge.kickUserFromRoom.called).to.be.false;
		});

		it('should not kick the user from the room if the user who executed the action does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves({});
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(undefined);
			await service.onUserRemovedFromRoom({} as any);

			expect(bridge.kickUserFromRoom.called).to.be.false;
		});

		it('should remove the user from the room if the room, user and the user who executed the action exists', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.onUserRemovedFromRoom({} as any);

			expect(bridge.kickUserFromRoom.calledWith(room.getExternalId(), user.getExternalId(), user.getExternalId())).to.be.true;
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

			expect(sendMessageStub.called).to.be.false;
			expect(sendQuoteMessageStub.called).to.be.false;
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

			expect(sendMessageStub.calledWith(room.getExternalId(), user.getExternalId(), { msg: 'text' })).to.be.true;
		});

		describe('Quoting messages', () => {
			it('should NOT send a quote message if the current attachment does not have a valid message_link (with a valid msg to reply to)', async () => {
				userAdapter.getFederatedUserByInternalId.resolves({});
				roomAdapter.getFederatedRoomByInternalId.resolves({});

				await service.sendExternalMessage({
					internalRoomId: 'internalRoomId',
					message: { attachments: [{ message_link: 'http://localhost:3000/group/1' }] },
				} as any);

				expect(sendMessageStub.called).to.be.false;
				expect(sendQuoteMessageStub.called).to.be.false;
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
				expect(sendMessageStub.called).to.be.false;
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

			expect(bridge.redactEvent.called).to.be.false;
		});

		it('should not delete the message remotely if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterMessageDeleted({ msg: 'msg', u: { _id: 'id' } } as any, 'internalRoomId');

			expect(bridge.redactEvent.called).to.be.false;
		});

		it('should not delete the message remotely if the message is not an external one', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageDeleted({ msg: 'msg', u: { _id: 'id' } } as any, 'internalRoomId');

			expect(bridge.redactEvent.called).to.be.false;
		});

		it('should not delete the message remotely if the message was already deleted (it was just updated to keep the chat history)', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageDeleted(
				{
					msg: 'msg',
					federation: { eventId: 'id' },
					editedAt: new Date(),
					editedBy: 'id',
					t: 'rm',
					u: { _id: 'id' },
				} as any,
				'internalRoomId',
			);

			expect(bridge.redactEvent.called).to.be.false;
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

			expect(bridge.redactEvent.called).to.be.false;
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

			expect(bridge.redactEvent.calledWith(room.getExternalId(), user.getExternalId(), 'federationEventId')).to.be.true;
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

			expect(bridge.updateMessage.called).to.be.false;
		});

		it('should not update the message remotely if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterMessageUpdated({ msg: 'msg' } as any, 'internalRoomId', 'internalUserId');

			expect(bridge.updateMessage.called).to.be.false;
		});

		it('should not update the message remotely if the message is not an external one', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageUpdated({ msg: 'msg' } as any, 'internalRoomId', 'internalUserId');

			expect(bridge.updateMessage.called).to.be.false;
		});

		it('should not update the message remotely if it was updated not by the sender', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await service.afterMessageUpdated(
				{ msg: 'msg', federation: { eventId: 'federationEventId' }, u: { _id: 'sender' } } as any,
				'internalRoomId',
				'internalUserId',
			);

			expect(bridge.updateMessage.called).to.be.false;
		});

		it('should not update the message remotely if the user is not from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);

			await service.afterMessageUpdated(
				{
					msg: 'msg',
					editedAt: new Date(),
					editedBy: 'id',
					federation: { eventId: 'federationEventId' },
					u: { _id: 'internalUserId' },
				} as any,
				'internalRoomId',
				'internalUserId',
			);

			expect(bridge.updateMessage.called).to.be.false;
		});

		it('should update the message remotely', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);

			await service.afterMessageUpdated(
				{
					msg: 'msg',
					editedAt: new Date(),
					editedBy: 'id',
					federation: { eventId: 'federationEventId' },
					u: { _id: 'internalUserId' },
				} as any,
				'internalRoomId',
				'internalUserId',
			);

			expect(bridge.updateMessage.calledWith(room.getExternalId(), user.getExternalId(), 'federationEventId', 'msg')).to.be.true;
		});
	});
});
