import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { EVENT_ORIGIN } from '../../../../../../../server/services/federation/domain/IFederationBridge';

const { FederationRoomServiceReceiver } = proxyquire
	.noCallThru()
	.load('../../../../../../../server/services/federation/application/room/receiver/RoomServiceReceiver', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../server/services/federation/domain/FederatedUser', {
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
	.load('../../../../../../../server/services/federation/domain/FederatedRoom', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('Federation - Application - FederationRoomServiceReceiver', () => {
	let service: typeof FederationRoomServiceReceiver;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		createFederatedRoomForDirectMessage: sinon.stub(),
		removeDirectMessageRoom: sinon.stub(),
		removeUserFromRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
		isUserAlreadyJoined: sinon.stub(),
		getInternalRoomById: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
		updateRoomType: sinon.stub(),
		updateRoomName: sinon.stub(),
		updateRoomTopic: sinon.stub(),
		applyRoomRolesToUser: sinon.stub(),
		updateDisplayRoomName: sinon.stub(),
		addUsersToRoomWhenJoinExternalPublicRoom: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		updateFederationAvatar: sinon.stub(),
		setAvatar: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
		updateRealName: sinon.stub(),
		getFederatedUsersByExternalIds: sinon.stub(),
	};
	const messageAdapter = {
		sendMessage: sinon.stub(),
		sendFileMessage: sinon.stub(),
		deleteMessage: sinon.stub(),
		getMessageByFederationId: sinon.stub(),
		editMessage: sinon.stub(),
		findOneByFederationIdOnReactions: sinon.stub(),
		unreactToMessage: sinon.stub(),
		sendQuoteMessage: sinon.stub(),
		sendQuoteFileMessage: sinon.stub(),
		editQuotedMessage: sinon.stub(),
		getMessageToEditWhenReplyAndQuote: sinon.stub(),
		sendThreadQuoteMessage: sinon.stub(),
		sendThreadMessage: sinon.stub(),
		sendThreadFileMessage: sinon.stub(),
		sendThreadQuoteFileMessage: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const notificationsAdapter = {
		subscribeToUserTypingEventsOnFederatedRoomId: sinon.stub(),
		broadcastUserTypingOnRoom: sinon.stub(),
	};
	const fileAdapter = {
		uploadFile: sinon.stub(),
	};
	const queueInstance = {
		addToQueue: sinon.stub(),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		extractHomeserverOrigin: sinon.stub().returns('localDomain'),
		joinRoom: sinon.stub(),
		convertMatrixUrlToHttp: sinon.stub().returns('toHttpUrl'),
		getReadStreamForFileFromUrl: sinon.stub(),
		getRoomHistoricalJoinEvents: sinon.stub(),
		getRoomData: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationRoomServiceReceiver(
			roomAdapter as any,
			userAdapter as any,
			messageAdapter as any,
			fileAdapter as any,
			settingsAdapter as any,
			notificationsAdapter as any,
			queueInstance as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.createFederatedRoomForDirectMessage.reset();
		roomAdapter.removeDirectMessageRoom.reset();
		roomAdapter.updateRoomType.reset();
		roomAdapter.updateRoomName.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.updateRoomTopic.reset();
		roomAdapter.removeUserFromRoom.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		roomAdapter.addUsersToRoomWhenJoinExternalPublicRoom.reset();
		roomAdapter.getInternalRoomById.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.applyRoomRolesToUser.reset();
		roomAdapter.updateDisplayRoomName.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.updateFederationAvatar.reset();
		userAdapter.setAvatar.reset();
		userAdapter.getInternalUserByUsername.reset();
		userAdapter.updateRealName.reset();
		userAdapter.getFederatedUsersByExternalIds.reset();
		messageAdapter.sendMessage.reset();
		messageAdapter.sendFileMessage.reset();
		messageAdapter.deleteMessage.reset();
		messageAdapter.getMessageByFederationId.reset();
		messageAdapter.editMessage.reset();
		messageAdapter.unreactToMessage.reset();
		messageAdapter.findOneByFederationIdOnReactions.reset();
		messageAdapter.sendQuoteFileMessage.reset();
		messageAdapter.sendQuoteMessage.reset();
		messageAdapter.sendThreadQuoteMessage.reset();
		messageAdapter.sendThreadMessage.reset();
		messageAdapter.sendThreadFileMessage.reset();
		messageAdapter.sendThreadQuoteFileMessage.reset();
		bridge.extractHomeserverOrigin.reset();
		bridge.joinRoom.reset();
		bridge.getUserProfileInformation.reset();
		bridge.getReadStreamForFileFromUrl.reset();
		bridge.getRoomData.reset();
		bridge.getRoomHistoricalJoinEvents.reset();
		fileAdapter.uploadFile.reset();
		queueInstance.addToQueue.reset();
	});

	describe('#onCreateRoom()', () => {
		it('should NOT create users nor room if the room already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			await service.onCreateRoom({} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT create users nor room if the room was created internally and programatically even if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onCreateRoom({ wasInternallyProgramaticallyCreated: true } as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT update the room if it was created internally and programatically but it is not a DM message and dont create the room', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			roomAdapter.getInternalRoomById.resolves({ t: 'c' });
			await service.onCreateRoom({ wasInternallyProgramaticallyCreated: true } as any);

			expect(roomAdapter.updateFederatedRoomByInternalRoomId.called).to.be.false;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT update the room if it was created internally and programatically but it does not exists and dont create the room', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			roomAdapter.getInternalRoomById.resolves(undefined);
			await service.onCreateRoom({ wasInternallyProgramaticallyCreated: true } as any);

			expect(roomAdapter.updateFederatedRoomByInternalRoomId.called).to.be.false;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should update the room if it was created internally and programatically but it is a DM message but it should NOT create a new DM Room(this is necessary due to a race condition on matrix events)', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			roomAdapter.getInternalRoomById.resolves({ t: 'd' });
			await service.onCreateRoom({
				wasInternallyProgramaticallyCreated: true,
				internalRoomId: 'internalRoomId',
				externalRoomId: 'externalRoomId',
			} as any);

			expect(roomAdapter.updateFederatedRoomByInternalRoomId.calledWith('internalRoomId', 'externalRoomId')).to.be.true;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});
	});

	describe('#onChangeRoomMembership()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT process the method if the room already exists AND event origin is equal to LOCAL', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT process the method if the room already exists AND event origin is equal to REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.REMOTE } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT process the method logic if the event was generated on the proxy home server, it is NOT a join event (user joining himself), but the room does not exists yet', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);

			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				externalInviterId: 'externalInviterId',
				externalInviteeId: 'externalInviteeId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
			} as any);
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT create the inviter if it already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the inviter if it does not exists', async () => {
			const inviter = FederatedUser.createInstance('externalInviterId', {
				name: 'inviterUsernameOnly',
				username: 'inviterUsernameOnly',
				existsOnlyOnProxyServer: true,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				externalInviterId: 'externalInviterId',
				normalizedInviterId: 'normalizedInviterId',
				inviterUsernameOnly: 'inviterUsernameOnly',
			} as any);

			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
		});

		it('should NOT create the invitee if it already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee if it does not exists', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			userAdapter.getFederatedUserByExternalId.onSecondCall().resolves(undefined);
			bridge.extractHomeserverOrigin.onCall(1).returns('externalDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should throw an error if the invitee user does not exists at all', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);

			await expect(
				service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					externalInviteeId: 'externalInviteeId',
					normalizedInviteeId: 'normalizedInviteeId',
				} as any),
			).to.be.rejectedWith('Invitee or inviter user not found');
		});

		it('should throw an error if the inviter user does not exists at all', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);

			await expect(
				service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					externalInviteeId: 'externalInviteeId',
					normalizedInviteeId: 'normalizedInviteeId',
				} as any),
			).to.be.rejectedWith('Invitee or inviter user not found');
		});

		it('should NOT create the room if it does not exists yet AND the event origin is REMOTE but there is no room type on the event', async () => {
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: undefined,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should create a room for DM if the room type is equal a direct message and it is handling regular events (m.room.member)(not using the property extracted from the invite_room_state)', async () => {
			const inviter = user;
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(inviter);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.DIRECT_MESSAGE,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			const createdRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', inviter, [inviter, invitee]);
			expect(roomAdapter.createFederatedRoomForDirectMessage.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(bridge.joinRoom.calledOnceWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should create a room for DM if the room type is equal a direct message and it is handling regular events (m.room.member)(not using the property extracted from the invite_room_state), but not automatically join the invitee if he/she is not from the proxy homeserver', async () => {
			const inviter = user;
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(inviter);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.extractHomeserverOrigin.returns('externalDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.DIRECT_MESSAGE,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			const createdRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', inviter, [inviter, invitee]);
			expect(roomAdapter.createFederatedRoomForDirectMessage.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
		});

		it('should create a room for DM if the room type is equal a direct message handling the property extracted from the invite_room_state', async () => {
			const inviter = user;
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(inviter);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.DIRECT_MESSAGE,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
				allInviteesExternalIdsWhenDM: [
					{
						externalInviteeId: 'externalInviteeId',
						normalizedInviteeId: 'normalizedInviteeId',
						inviteeUsernameOnly: 'inviteeUsernameOnly',
					},
				],
			} as any);

			const createdRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', inviter, [inviter, invitee]);
			expect(roomAdapter.createFederatedRoomForDirectMessage.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(bridge.joinRoom.calledOnceWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should create a room for DM if the room type is equal a direct message handling the property extracted from the invite_room_state, but not automatically join the user if he/she is not from the proxy homeserver', async () => {
			const inviter = user;
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(inviter);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.extractHomeserverOrigin.returns('externalDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.DIRECT_MESSAGE,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
				allInviteesExternalIdsWhenDM: [
					{
						externalInviteeId: 'externalInviteeId',
						normalizedInviteeId: 'normalizedInviteeId',
						inviteeUsernameOnly: 'inviteeUsernameOnly',
					},
				],
			} as any);

			const createdRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', inviter, [inviter, invitee]);
			expect(roomAdapter.createFederatedRoomForDirectMessage.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
		});

		it('should create a room (not DM) if the room type is NOT equal a direct message AND to add the historical room events to the processing queue when they exists', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.getRoomHistoricalJoinEvents.resolves(['event1', 'event2']);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
				externalRoomName: 'externalRoomName',
			} as any);

			const createdRoom = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', invitee, RoomType.CHANNEL);

			expect(roomAdapter.createFederatedRoom.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
			['event1', 'event2'].forEach((event) => expect(queueInstance.addToQueue.calledWith(event)).to.be.true);
		});

		it('should create a room (not DM) if the room type is NOT equal a direct message AND NOT to add the historical room events to the processing queue when they exists', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.getRoomHistoricalJoinEvents.resolves([]);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
				externalRoomName: 'externalRoomName',
			} as any);

			const createdRoom = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', invitee, RoomType.CHANNEL);

			expect(roomAdapter.createFederatedRoom.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
			expect(queueInstance.addToQueue.called).to.be.false;
		});

		it('should call the update name function if the name is inside the received input', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			bridge.getRoomHistoricalJoinEvents.resolves([]);
			const spy = sinon.spy(service, 'onChangeRoomName');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
				externalRoomName: 'externalRoomName',
				externalEventId: 'externalEventId',
				externalInviterId: 'externalInviterId',
			} as any);

			expect(
				spy.calledWith({
					externalRoomId: 'externalRoomId',
					normalizedRoomName: 'externalRoomName',
					externalEventId: 'externalEventId',
					externalSenderId: 'externalInviterId',
					normalizedRoomId: 'normalizedRoomId',
				}),
			).to.be.true;
		});

		it('should NOT create the room if it already exists yet AND the event origin is REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
		});

		it('should remove the user from room if its a LEAVE event and the user is in the room already', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			roomAdapter.isUserAlreadyJoined.resolves(true);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: true,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.calledWith(room, user, user)).to.be.true;
			expect(roomAdapter.addUserToRoom.called).to.be.false;
		});

		it('should NOT remove the user from room if its a LEAVE event and the user is NOT in the room anymore', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			roomAdapter.isUserAlreadyJoined.resolves(false);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: true,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.called).to.be.false;
			expect(roomAdapter.addUserToRoom.called).to.be.false;
		});

		it('should NOT remove and recreate the DM room if the user is already part of the room (in case of being a multiple DM, Matrix send events for each user at a time, which requires us to remove and recreate the DM room)', async () => {
			const dmRoom = DirectMessageFederatedRoom.createWithInternalReference(
				'externalRoomId',
				{ usernames: [user.getUsername() as string] } as any,
				[user, user],
			);
			roomAdapter.getFederatedRoomByExternalId.resolves(dmRoom);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.DIRECT_MESSAGE,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeDirectMessageRoom.called).to.be.false;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
		});

		it('should remove and recreate the DM room if the user is part of the room yet (in case of being a multiple DM, Matrix send events for each user at a time, which requires us to remove and recreate the DM room)', async () => {
			const dmRoom = DirectMessageFederatedRoom.createWithInternalReference('externalRoomId', { usernames: [] } as any, [user, user]);
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(dmRoom);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(invitee);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.DIRECT_MESSAGE,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			const createdRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, user, invitee]);

			expect(roomAdapter.removeDirectMessageRoom.calledWith(dmRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoomForDirectMessage.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.addUserToRoom.called).to.be.false;
		});

		it('should NOT add the user to the room if its NOT a LEAVE event but the user is already in the room', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			roomAdapter.isUserAlreadyJoined.resolves(true);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.called).to.be.false;
			expect(roomAdapter.removeDirectMessageRoom.called).to.be.false;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
			expect(roomAdapter.addUserToRoom.called).to.be.false;
		});

		it('should add the user into the room if its NOT a LEAVE event providing the inviter when the user is NOT joining by himself', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.called).to.be.false;
			expect(roomAdapter.removeDirectMessageRoom.called).to.be.false;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
			expect(roomAdapter.addUserToRoom.calledWith(room, user, user)).to.be.true;
		});

		it('should join the room using the bridge if its NOT a leave event AND the invitee is from the proxy home server', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.addUserToRoom.calledWith(room, user, user)).to.be.true;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should NOT join the room using the bridge if its NOT a leave event AND the invitee is NOT from the proxy home server', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('externalDomain');
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.addUserToRoom.calledWith(room, user, user)).to.be.true;
			expect(bridge.joinRoom.called).to.be.false;
		});

		it('should add the user into the room if its NOT a LEAVE event NOT providing the inviter when the user is joining by himself', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				externalInviterId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.called).to.be.false;
			expect(roomAdapter.removeDirectMessageRoom.called).to.be.false;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
			expect(roomAdapter.addUserToRoom.calledWith(room, user)).to.be.true;
		});

		describe('Handling users auto-joining', () => {
			it('should subscribe to the typings events if the room already exists', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(notificationsAdapter.subscribeToUserTypingEventsOnFederatedRoomId.called).to.be.true;
			});

			it('should NOT add the user to the room if the user is already a room member', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				roomAdapter.isUserAlreadyJoined.resolves(true);
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(roomAdapter.addUserToRoom.called).to.be.false;
			});

			it('should add the user to the room if the user is NOT a room member yet', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				roomAdapter.isUserAlreadyJoined.resolves(false);
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(roomAdapter.addUserToRoom.calledWith(room, user)).to.be.true;
			});

			it('should NOT create the room if it was not possible to retrieve the information from the room from the bridge', async () => {
				roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(room);
				roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				roomAdapter.isUserAlreadyJoined.resolves(false);
				bridge.getRoomData.resolves(undefined);
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(roomAdapter.createFederatedRoom.called).to.be.false;
			});

			it('should NOT create the room if it there is already a room creation process already running', async () => {
				roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(room);
				roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				roomAdapter.isUserAlreadyJoined.resolves(false);
				bridge.getRoomData.resolves({ creator: {} });
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(roomAdapter.createFederatedRoom.called).to.be.false;
			});

			it('should create the creator user only if it does not exists yet and use the provided username if its from the same homeserver', async () => {
				const spy = sinon.spy(service, 'createFederatedUserInternallyOnly');
				roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(room);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(undefined);
				bridge.getRoomData.resolves({ creator: { id: 'creatorId', username: 'creatorUsername' } });
				bridge.extractHomeserverOrigin.returns('localDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				const existsOnlyOnProxyServer = true;

				expect(spy.calledWith('creatorId', 'creatorUsername', existsOnlyOnProxyServer)).to.be.true;
			});

			it('should create the creator user if it does not exists yet and use the external id as username if its not from the same homeserver', async () => {
				const spy = sinon.spy(service, 'createFederatedUserInternallyOnly');
				roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(room);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(undefined);
				bridge.getRoomData.resolves({ creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' } });
				bridge.extractHomeserverOrigin.returns('externalDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				const existsOnlyOnProxyServer = false;

				expect(spy.calledWith('@creatorId:externalserver.com', 'creatorId:externalserver.com', existsOnlyOnProxyServer)).to.be.true;
			});

			it('should NOT create the room if the creator does not exists nor was created successfully previously', async () => {
				sinon.stub(service, 'createFederatedUserAndReturnIt').resolves();
				roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				bridge.getRoomData.resolves({ creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' } });
				bridge.extractHomeserverOrigin.returns('externalDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(roomAdapter.createFederatedRoom.called).to.be.false;
			});

			it('should create the room using the external room name if its original from the same homeserver', async () => {
				sinon.stub(service, 'createFederatedUserAndReturnIt').resolves();
				roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(user);
				bridge.getRoomData.resolves({ name: 'roomName', creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' } });
				bridge.extractHomeserverOrigin.returns('localDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(
					roomAdapter.createFederatedRoom.calledWith(
						FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'roomName'),
					),
				).to.be.true;
			});

			it('should create the room using nothing if its not original from the same homeserver', async () => {
				sinon.stub(service, 'createFederatedUserAndReturnIt').resolves();
				roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(user);
				bridge.getRoomData.resolves({ name: 'roomName', creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' } });
				bridge.extractHomeserverOrigin.returns('externalDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(
					roomAdapter.createFederatedRoom.calledWith(
						FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, undefined),
					),
				).to.be.true;
			});

			it('should dispatch a room name event if its not from the same homeserver and it was possible to retrieve the name from the bridge query', async () => {
				const spy = sinon.spy(service, 'onChangeRoomName');
				sinon.stub(service, 'createFederatedUserAndReturnIt').resolves();
				roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(user);
				roomAdapter.createFederatedRoom.resolves();
				bridge.getRoomData.resolves({ name: 'roomName', creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' } });
				bridge.extractHomeserverOrigin.returns('externalDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(
					spy.calledWith({
						externalRoomId: 'externalRoomId',
						normalizedRoomName: 'roomName',
						externalEventId: '',
						externalSenderId: user.getExternalId(),
						normalizedRoomId: 'normalizedRoomId',
					}),
				).to.be.true;
			});

			it('should create federated users for each member of the room excluding the one joining and the creator, and add them to the room ', async () => {
				const stub = sinon.stub(service, 'createFederatedUserAndReturnIt');
				roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
				roomAdapter.getFederatedRoomByExternalId.onCall(1).resolves(undefined);
				roomAdapter.getFederatedRoomByExternalId.onCall(2).resolves(room);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(user);
				stub.resolves(user);
				roomAdapter.createFederatedRoom.resolves({});
				bridge.getRoomData.resolves({
					joinedMembers: ['user1', '@creatorId:externalserver.com', user.getExternalId(), 'user2'],
					creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' },
				});
				bridge.extractHomeserverOrigin.returns('localDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(stub.callCount).to.be.equal(3);
				expect(stub.getCall(1).calledWith('user1')).to.be.true;
				expect(stub.getCall(2).calledWith('user2')).to.be.true;

				expect(roomAdapter.addUsersToRoomWhenJoinExternalPublicRoom.calledWith([user, user])).to.be.true;
			});

			it('should add the user to the room and subscribe to typings events if everything was done correctly', async () => {
				sinon.stub(service, 'createFederatedUserAndReturnIt').resolves(user);
				roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
				roomAdapter.getFederatedRoomByExternalId.onCall(1).resolves(undefined);
				roomAdapter.getFederatedRoomByExternalId.onCall(2).resolves(room);
				userAdapter.getFederatedUserByExternalId.onCall(0).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(1).resolves(user);
				userAdapter.getFederatedUserByExternalId.onCall(2).resolves(undefined);
				userAdapter.getFederatedUserByExternalId.onCall(3).resolves(user);
				roomAdapter.createFederatedRoom.resolves({});
				bridge.getRoomData.resolves({
					joinedMembers: ['user1', '@creatorId:externalserver.com', user.getExternalId(), 'user2'],
					creator: { id: '@creatorId:externalserver.com', username: 'creatorUsername' },
				});
				bridge.extractHomeserverOrigin.returns('localDomain');
				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					externalInviterId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(notificationsAdapter.subscribeToUserTypingEventsOnFederatedRoomId.called).to.be.true;
				expect(roomAdapter.addUserToRoom.calledWith(room, user)).to.be.true;
			});
		});

		describe('User profile changed event', () => {
			it('should NOT call the function to update the user avatar if the event does not include an avatarUrl property', async () => {
				const spy = sinon.spy(service, 'updateUserAvatarInternally');

				await service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.LOCAL,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					leave: false,
					normalizedInviteeId: 'normalizedInviteeId',
				} as any);

				expect(spy.called).to.be.false;
			});

			const eventForUserProfileChanges = {
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
				userProfile: {
					avatarUrl: 'avatarUrl',
					displayName: 'displayName',
				},
			} as any;

			it('should NOT call the function to update the avatar internally if the user does not exists', async () => {
				const spy = sinon.spy(service, 'updateUserAvatarInternally');
				userAdapter.getFederatedUserByExternalId.resolves(undefined);
				await service.onChangeRoomMembership(eventForUserProfileChanges);

				expect(spy.called).to.be.false;
			});

			it('should NOT update the avatar nor the display name if both does not exists', async () => {
				userAdapter.getFederatedUserByExternalId.resolves(user);
				await service.onChangeRoomMembership({ ...eventForUserProfileChanges, userProfile: {} });

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
				await service.onChangeRoomMembership(eventForUserProfileChanges);

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
					}),
				);
				await service.onChangeRoomMembership({ ...eventForUserProfileChanges, userProfile: { avatarUrl: 'avatarUrl' } });

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
				});
				userAdapter.getFederatedUserByExternalId.resolves(userAvatar);
				await service.onChangeRoomMembership(eventForUserProfileChanges);

				expect(userAdapter.setAvatar.calledWith(userAvatar, 'toHttpUrl')).to.be.true;
				expect(userAdapter.updateFederationAvatar.calledWith(userAvatar.getInternalId(), 'avatarUrl')).to.be.true;
			});

			it('should NOT update the display name if the name received in the event is equal to the one already used', async () => {
				const existsOnlyOnProxyServer = false;
				userAdapter.getFederatedUserByExternalId.resolves(
					FederatedUser.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
						name: 'displayName',
					}),
				);
				await service.onChangeRoomMembership({ ...eventForUserProfileChanges, userProfile: { displayName: 'displayName' } });

				expect(userAdapter.setAvatar.called).to.be.false;
				expect(userAdapter.updateFederationAvatar.called).to.be.false;
				expect(userAdapter.updateRealName.called).to.be.false;
			});

			it('should call the functions to update the display name internally correctly', async () => {
				const existsOnlyOnProxyServer = false;
				const user = FederatedUser.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
					_id: 'userId',
					name: 'currentName',
				});
				userAdapter.getFederatedUserByExternalId.resolves(user);
				await service.onChangeRoomMembership({ ...eventForUserProfileChanges, userProfile: { displayName: 'displayName' } });

				expect(userAdapter.setAvatar.called).to.be.false;
				expect(userAdapter.updateFederationAvatar.called).to.be.false;
				expect(userAdapter.updateRealName.calledWith(user.getInternalReference(), 'displayName')).to.be.true;
			});
		});
	});

	describe('#onExternalFileMessageReceived()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
		it('should NOT send a message if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onExternalFileMessageReceived({
				messageText: 'text',
			} as any);

			expect(messageAdapter.sendFileMessage.called).to.be.false;
		});

		it('should NOT send a message if the sender does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onExternalFileMessageReceived({
				messageText: 'text',
			} as any);

			expect(messageAdapter.sendFileMessage.called).to.be.false;
		});

		it('should send a message if the room and the sender already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getReadStreamForFileFromUrl.resolves();
			const files = [{ id: 'fileId', name: 'filename' }];
			const attachments = ['attachment', 'attachment2'];
			fileAdapter.uploadFile.resolves({ files, attachments } as any);

			await service.onExternalFileMessageReceived({
				messageBody: {
					filename: 'filename',
					size: 12,
					mimetype: 'mimetype',
					url: 'url',
				},
			} as any);

			expect(messageAdapter.sendFileMessage.calledWith(user, room, files, attachments)).to.be.true;
		});

		describe('Quoting messages', () => {
			it('should NOT send a quote message if its necessary to quote but the message to quote does not exists', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.resolves(undefined);
				fileAdapter.uploadFile.resolves({} as any);
				await service.onExternalFileMessageReceived({
					messageBody: {
						filename: 'filename',
						size: 12,
						mimetype: 'mimetype',
						url: 'url',
					},
					replyToEventId: 'replyToEventId',
				} as any);

				expect(messageAdapter.sendQuoteFileMessage.called).to.be.false;
				expect(messageAdapter.sendFileMessage.called).to.be.false;
			});

			it('should send a quote message if its necessary to quote and the message to quote exists', async () => {
				const messageToReplyTo = { federation: { eventId: 'eventId' } } as any;
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.onFirstCall().resolves(undefined);
				messageAdapter.getMessageByFederationId.onSecondCall().resolves(messageToReplyTo);
				const files = [{ id: 'fileId', name: 'filename' }];
				const attachments = ['attachment', 'attachment2'];
				fileAdapter.uploadFile.resolves({ files, attachments } as any);

				await service.onExternalFileMessageReceived({
					messageBody: {
						filename: 'filename',
						size: 12,
						mimetype: 'mimetype',
						url: 'url',
					},
					replyToEventId: 'replyToEventId',
					externalEventId: 'externalEventId',
				} as any);

				expect(
					messageAdapter.sendQuoteFileMessage.calledWith(
						user,
						room,
						files,
						attachments,
						'externalEventId',
						messageToReplyTo,
						'localDomain',
					),
				).to.be.true;
				expect(messageAdapter.sendFileMessage.called).to.be.false;
			});
		});
	});

	describe('#onExternalMessageReceived()', () => {
		it('should NOT send a message if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onExternalMessageReceived({
				messageText: 'text',
			} as any);

			expect(messageAdapter.sendMessage.called).to.be.false;
		});

		it('should NOT send a message if the sender does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onExternalMessageReceived({
				messageText: 'text',
			} as any);

			expect(messageAdapter.sendMessage.called).to.be.false;
		});

		it('should NOT send a message if the message was already be sent through federation and is just a reply back event', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			messageAdapter.getMessageByFederationId.resolves({} as any);
			await service.onExternalMessageReceived({
				messageText: 'text',
			} as any);

			expect(messageAdapter.sendMessage.called).to.be.false;
		});

		it('should send a message if the room, the sender already exists and the message does not exists, because it was sent originally from Matrix', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			messageAdapter.getMessageByFederationId.resolves(undefined);
			await service.onExternalMessageReceived({
				messageText: 'text',
				rawMessage: 'rawMessage',
				externalFormattedText: 'externalFormattedText',
				externalEventId: 'externalEventId',
			} as any);

			expect(messageAdapter.sendMessage.calledWith({}, {}, 'rawMessage', 'externalFormattedText', 'externalEventId', 'localDomain')).to.be
				.true;
			expect(messageAdapter.sendQuoteMessage.called).to.be.false;
		});

		describe('Quoting messages', () => {
			it('should NOT send a quote message if its necessary to quote but the message to quote does not exists', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
				userAdapter.getFederatedUserByExternalId.resolves({} as any);
				messageAdapter.getMessageByFederationId.resolves(undefined);
				await service.onExternalMessageReceived({
					messageText: 'text',
					replyToEventId: 'replyToEventId',
				} as any);

				expect(messageAdapter.sendQuoteMessage.called).to.be.false;
				expect(messageAdapter.sendMessage.called).to.be.false;
			});

			it('should send a quote message if its necessary to quote and the message to quote exists', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
				userAdapter.getFederatedUserByExternalId.resolves({} as any);
				messageAdapter.getMessageByFederationId.onFirstCall().resolves(undefined);
				messageAdapter.getMessageByFederationId.onSecondCall().resolves({} as any);
				await service.onExternalMessageReceived({
					messageText: 'text',
					externalEventId: 'externalEventId',
					replyToEventId: 'replyToEventId',
					rawMessage: 'rawMessage',
					externalFormattedText: 'externalFormattedText',
				} as any);

				expect(
					messageAdapter.sendQuoteMessage.calledWith({}, {}, 'externalFormattedText', 'rawMessage', 'externalEventId', {}, 'localDomain'),
				).to.be.true;
				expect(messageAdapter.sendMessage.called).to.be.false;
			});
		});
	});

	describe('#onChangeJoinRules()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
		it('should NOT change the room type if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onChangeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);

			expect(roomAdapter.updateRoomType.called).to.be.false;
		});

		it('should NOT change the room type if it exists and is a direct message', async () => {
			const dmRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, user]);
			roomAdapter.getFederatedRoomByExternalId.resolves(dmRoom);
			await service.onChangeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);

			expect(roomAdapter.updateRoomType.called).to.be.false;
		});

		it('should change the room type if it exists and is NOT a direct message', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.onChangeJoinRules({
				roomType: RoomType.PRIVATE_GROUP,
			} as any);
			room.changeRoomType(RoomType.PRIVATE_GROUP);
			expect(roomAdapter.updateRoomType.calledWith(room)).to.be.true;
		});
	});

	describe('#onChangeRoomName()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
		it('should NOT change the room name if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onChangeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
			expect(roomAdapter.updateDisplayRoomName.called).to.be.false;
		});

		it('should NOT change the room name if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onChangeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
			expect(roomAdapter.updateDisplayRoomName.called).to.be.false;
		});

		it('should NOT change the room name if the room is an internal room', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await service.onChangeRoomName({
				externalRoomId: '!externalRoomId:localDomain',
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
		});
		it('should change the room name if the room is NOT an internal room', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('externalDomain');
			await service.onChangeRoomName({
				externalRoomId: '!externalRoomId:externalDomain',
				normalizedRoomName: 'normalizedRoomName',
			} as any);
			room.changeRoomName('!externalRoomId:externalDomain');
			expect(roomAdapter.updateRoomName.calledWith(room)).to.be.true;
		});

		it('should NOT change the room fname if it exists and is a direct message', async () => {
			const dmRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, user]);
			roomAdapter.getFederatedRoomByExternalId.resolves(dmRoom);
			await service.onChangeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateDisplayRoomName.called).to.be.false;
		});

		it('should change the room fname if it exists and is NOT a direct message', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomName({
				normalizedRoomName: 'normalizedRoomName2',
			} as any);
			room.changeDisplayRoomName('normalizedRoomName2');

			expect(roomAdapter.updateDisplayRoomName.calledWith(room, user)).to.be.true;
		});
	});

	describe('#onChangeRoomTopic()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
		it('should NOT change the room topic if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onChangeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);

			expect(roomAdapter.updateRoomTopic.called).to.be.false;
		});

		it('should NOT change the room topic if it exists and is a direct message', async () => {
			const dmRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, user]);
			roomAdapter.getFederatedRoomByExternalId.resolves(dmRoom);
			await service.onChangeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);

			expect(roomAdapter.updateRoomTopic.called).to.be.false;
		});

		it('should change the room topic if it exists and is NOT a direct message', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);
			room.changeRoomTopic('roomTopic');
			expect(roomAdapter.updateRoomTopic.calledWith(room, user)).to.be.true;
		});
	});

	describe('#onRedactEvent()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT delete the message if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onRedactEvent({
				redactsEvent: 'redactsEvent',
			} as any);

			expect(messageAdapter.deleteMessage.called).to.be.false;
			expect(messageAdapter.unreactToMessage.called).to.be.false;
		});

		it('should NOT delete the message if the sender does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onRedactEvent({
				redactsEvent: 'redactsEvent',
			} as any);

			expect(messageAdapter.deleteMessage.called).to.be.false;
			expect(messageAdapter.unreactToMessage.called).to.be.false;
		});

		it('should NOT delete the message if the message does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves(undefined);
			await service.onRedactEvent({
				redactsEvent: 'redactsEvent',
			} as any);

			expect(messageAdapter.deleteMessage.called).to.be.false;
			expect(messageAdapter.unreactToMessage.called).to.be.false;
		});

		it('should delete the message if its a raw text redact handler', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves({ msg: 'msg' });
			messageAdapter.findOneByFederationIdOnReactions.resolves(undefined);
			await service.onRedactEvent({
				redactsEvent: 'redactsEvent',
			} as any);

			expect(messageAdapter.deleteMessage.calledWith({ msg: 'msg' }, user)).to.be.true;
			expect(messageAdapter.unreactToMessage.called).to.be.false;
		});

		it('should NOT unreact if the message was not reacted before by the user', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves(undefined);
			messageAdapter.findOneByFederationIdOnReactions.resolves({
				msg: 'msg',
				reactions: {
					reaction: {
						federationReactionEventIds: {},
						usernames: [],
					},
				},
			});
			await service.onRedactEvent({
				redactsEvent: 'redactsEvent',
			} as any);

			expect(messageAdapter.deleteMessage.called).to.be.false;
			expect(messageAdapter.unreactToMessage.called).to.be.false;
		});

		it('should unreact if the message was reacted before by the user', async () => {
			const message = {
				msg: 'msg',
				reactions: {
					reaction: {
						federationReactionEventIds: {
							redactsEvent: user.getUsername(),
						},
						usernames: [user.getUsername()],
					},
				},
			};
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves(undefined);
			messageAdapter.findOneByFederationIdOnReactions.resolves(message);
			await service.onRedactEvent({
				redactsEvent: 'redactsEvent',
			} as any);

			expect(messageAdapter.deleteMessage.called).to.be.false;
			expect(messageAdapter.unreactToMessage.calledWith(user, message, 'reaction', 'redactsEvent')).to.be.true;
		});
	});

	describe('#onExternalMessageEditedReceived()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT update the message if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onExternalMessageEditedReceived({
				editsEvent: 'editsEvent',
			} as any);

			expect(messageAdapter.editMessage.called).to.be.false;
		});

		it('should NOT update the message if the sender does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onExternalMessageEditedReceived({
				editsEvent: 'editsEvent',
			} as any);

			expect(messageAdapter.editMessage.called).to.be.false;
		});

		it('should NOT update the message if the message does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves(undefined);
			await service.onExternalMessageEditedReceived({
				editsEvent: 'editsEvent',
			} as any);

			expect(messageAdapter.editMessage.called).to.be.false;
		});

		it('should NOT update the message if the content of the message is equal of the oldest one', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves({ msg: 'newRawMessage' });
			await service.onExternalMessageEditedReceived({
				editsEvent: 'editsEvent',
				newRawMessage: 'newRawMessage',
			} as any);

			expect(messageAdapter.editMessage.called).to.be.false;
		});

		it('should update the message', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			messageAdapter.getMessageByFederationId.resolves({ msg: 'differentOne' });
			await service.onExternalMessageEditedReceived({
				editsEvent: 'editsEvent',
				newMessageText: 'newMessageText',
				newRawMessage: 'newRawMessage',
				newExternalFormattedText: 'newExternalFormattedText',
			} as any);

			expect(
				messageAdapter.editMessage.calledWith(user, 'newRawMessage', 'newExternalFormattedText', { msg: 'differentOne' }, 'localDomain'),
			).to.be.true;
		});

		describe('Editing quoted messages', () => {
			it('should NOT edit the quoted message if the event was generated locally (the message edited was on local server only)', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.resolves({ msg: 'differentOne', attachments: [{ message_link: 'link' }] });
				bridge.extractHomeserverOrigin.returns('localDomain');
				await service.onExternalMessageEditedReceived({
					editsEvent: 'editsEvent',
					newMessageText: 'newMessageText',
					newRawMessage: 'newRawMessage',
					newExternalFormattedText: 'newExternalFormattedText',
					externalSenderId: 'externalSenderId:localDomain',
				} as any);

				expect(messageAdapter.editMessage.called).to.be.false;
				expect(messageAdapter.editQuotedMessage.called).to.be.false;
			});

			it('should NOT edit the quoted message if the event was remotely generated but the message content is the same as the current one (the message is already up to date)', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.resolves({
					msg: 'internalFormattedMessageToBeEdited',
					attachments: [{ message_link: 'link' }],
				});
				bridge.extractHomeserverOrigin.returns('externalDomain');
				messageAdapter.getMessageToEditWhenReplyAndQuote.resolves('internalFormattedMessageToBeEdited');
				await service.onExternalMessageEditedReceived({
					editsEvent: 'editsEvent',
					newMessageText: 'newMessageText',
					newRawMessage: 'newRawMessage',
					newExternalFormattedText: 'newExternalFormattedText',
					externalSenderId: 'externalSenderId:externalDomain',
				} as any);

				expect(messageAdapter.editMessage.called).to.be.false;
				expect(messageAdapter.editQuotedMessage.called).to.be.false;
			});

			it('should edit the quoted message if the event was remotely the message content is outdated', async () => {
				const message = {
					msg: 'differentOne',
					attachments: [{ message_link: 'link' }],
				};
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.resolves(message);
				bridge.extractHomeserverOrigin.returns('externalDomain');
				messageAdapter.getMessageToEditWhenReplyAndQuote.resolves('internalFormattedMessageToBeEdited');
				await service.onExternalMessageEditedReceived({
					editsEvent: 'editsEvent',
					newMessageText: 'newMessageText',
					newRawMessage: 'newRawMessage',
					newExternalFormattedText: 'newExternalFormattedText',
					externalSenderId: 'externalSenderId:externalDomain',
				} as any);

				expect(messageAdapter.editMessage.called).to.be.false;
				expect(messageAdapter.editQuotedMessage.calledWith(user, 'newRawMessage', 'newExternalFormattedText', message, 'localDomain')).to.be
					.true;
			});
		});
	});

	describe('#onChangeRoomPowerLevels()', () => {
		const user = FederatedUser.createInstance('externalUserId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT update the room roles if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onChangeRoomPowerLevels({
				externalRoomId: 'externalRoomId',
				externalSenderId: 'externalSenderId',
				rolesChangesToApply: [],
			} as any);

			expect(roomAdapter.applyRoomRolesToUser.called).to.be.false;
		});

		it('should NOT update the room roles if the user does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onChangeRoomPowerLevels({
				externalRoomId: 'externalRoomId',
				externalSenderId: 'externalSenderId',
				rolesChangesToApply: [],
			} as any);

			expect(roomAdapter.applyRoomRolesToUser.called).to.be.false;
		});

		it('should NOT update the room roles if there is no target users', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			userAdapter.getFederatedUsersByExternalIds.resolves([]);
			await service.onChangeRoomPowerLevels({
				externalRoomId: 'externalRoomId',
				externalSenderId: 'externalSenderId',
				rolesChangesToApply: [],
			} as any);

			expect(roomAdapter.applyRoomRolesToUser.called).to.be.false;
		});

		it('should update the room roles adding one role to be added', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			userAdapter.getFederatedUsersByExternalIds.resolves([user]);
			await service.onChangeRoomPowerLevels({
				externalRoomId: 'externalRoomId',
				externalSenderId: 'externalSenderId',
				roleChangesToApply: {
					externalUserId: [
						{
							action: 'add',
							role: 'owner',
						},
					],
				},
			} as any);

			expect(
				roomAdapter.applyRoomRolesToUser.calledWith({
					federatedRoom: room,
					targetFederatedUser: user,
					fromUser: user,
					rolesToAdd: ['owner'],
					rolesToRemove: [],
					notifyChannel: true,
				}),
			).to.be.true;
		});

		it('should update the room roles adding one role to be removed', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			userAdapter.getFederatedUsersByExternalIds.resolves([user]);
			await service.onChangeRoomPowerLevels({
				externalRoomId: 'externalRoomId',
				externalSenderId: 'externalSenderId',
				roleChangesToApply: {
					externalUserId: [
						{
							action: 'remove',
							role: 'owner',
						},
					],
				},
			} as any);

			expect(
				roomAdapter.applyRoomRolesToUser.calledWith({
					federatedRoom: room,
					targetFederatedUser: user,
					fromUser: user,
					rolesToAdd: [],
					rolesToRemove: ['owner'],
					notifyChannel: true,
				}),
			).to.be.true;
		});
	});

	describe('#onExternalThreadedMessageReceived()', () => {
		it('should NOT send a message if the thread root event id does not exist', async () => {
			await service.onExternalThreadedMessageReceived({
				rawMessage: 'text',
			} as any);

			expect(messageAdapter.sendThreadMessage.called).to.be.false;
			expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
		});
		it('should NOT send a message if the internal thread parent message does not exist', async () => {
			messageAdapter.getMessageByFederationId.resolves(undefined);
			await service.onExternalThreadedMessageReceived({
				rawMessage: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadMessage.called).to.be.false;
			expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
		});
		it('should NOT send a message if the room does not exists', async () => {
			messageAdapter.getMessageByFederationId.resolves({});
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onExternalThreadedMessageReceived({
				rawMessage: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
			expect(messageAdapter.sendThreadMessage.called).to.be.false;
		});

		it('should NOT send a message if the sender does not exists', async () => {
			messageAdapter.getMessageByFederationId.resolves({});
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.onExternalThreadedMessageReceived({
				rawMessage: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
			expect(messageAdapter.sendThreadMessage.called).to.be.false;
		});

		it('should NOT send a message if the message was already be sent through federation and is just a reply back event', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			messageAdapter.getMessageByFederationId.resolves({} as any);
			await service.onExternalThreadedMessageReceived({
				messageText: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
			expect(messageAdapter.sendThreadMessage.called).to.be.false;
		});

		it('should send a message if the room, the sender already exists and the message does not exists, because it was sent originally from Matrix', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			messageAdapter.getMessageByFederationId.onFirstCall().resolves({ _id: 'messageThreadId' });
			roomAdapter.getFederatedRoomByExternalId.onSecondCall().resolves(undefined);
			await service.onExternalThreadedMessageReceived({
				messageText: 'text',
				rawMessage: 'rawMessage',
				externalFormattedText: 'externalFormattedText',
				externalEventId: 'externalEventId',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(
				messageAdapter.sendThreadMessage.calledWith(
					{},
					{},
					'rawMessage',
					'externalEventId',
					'messageThreadId',
					'externalFormattedText',
					'localDomain',
				),
			).to.be.true;
			expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
		});

		describe('Quoting messages', () => {
			it('should NOT send a quote message if its necessary to quote but the message to quote does not exists', async () => {
				messageAdapter.getMessageByFederationId.onFirstCall().resolves({ _id: 'messageThreadId' });
				roomAdapter.getFederatedRoomByExternalId.onSecondCall().resolves(undefined);
				roomAdapter.getFederatedRoomByExternalId.onThirdCall().resolves(undefined);
				roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
				userAdapter.getFederatedUserByExternalId.resolves({} as any);
				messageAdapter.getMessageByFederationId.resolves(undefined);
				await service.onExternalThreadedMessageReceived({
					messageText: 'text',
					replyToEventId: 'replyToEventId',
					thread: { rootEventId: 'rootEventId' },
				} as any);

				expect(messageAdapter.sendThreadQuoteMessage.called).to.be.false;
				expect(messageAdapter.sendThreadMessage.called).to.be.false;
			});

			it('should send a quote message if its necessary to quote and the message to quote exists', async () => {
				messageAdapter.getMessageByFederationId.onFirstCall().resolves({ _id: 'messageThreadId' });
				roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
				userAdapter.getFederatedUserByExternalId.resolves({} as any);
				messageAdapter.getMessageByFederationId.onSecondCall().resolves(undefined);
				messageAdapter.getMessageByFederationId.onThirdCall().resolves({} as any);
				await service.onExternalThreadedMessageReceived({
					messageText: 'text',
					externalEventId: 'externalEventId',
					replyToEventId: 'replyToEventId',
					rawMessage: 'rawMessage',
					externalFormattedText: 'externalFormattedText',
					thread: { rootEventId: 'rootEventId' },
				} as any);

				expect(
					messageAdapter.sendThreadQuoteMessage.calledWith(
						{},
						{},
						'rawMessage',
						'externalEventId',
						{},
						'localDomain',
						'messageThreadId',
						'externalFormattedText',
					),
				).to.be.true;
				expect(messageAdapter.sendThreadMessage.called).to.be.false;
			});
		});
	});

	describe('#onExternalThreadedFileMessageReceived()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT send a message if the thread root event id does not exist', async () => {
			await service.onExternalThreadedFileMessageReceived({
				rawMessage: 'text',
			} as any);

			expect(messageAdapter.sendThreadQuoteFileMessage.called).to.be.false;
			expect(messageAdapter.sendThreadFileMessage.called).to.be.false;
		});
		it('should NOT send a message if the internal thread parent message does not exist', async () => {
			messageAdapter.getMessageByFederationId.resolves(undefined);
			await service.onExternalThreadedFileMessageReceived({
				rawMessage: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadQuoteFileMessage.called).to.be.false;
			expect(messageAdapter.sendThreadFileMessage.called).to.be.false;
		});
		it('should NOT send a message if the room does not exists', async () => {
			messageAdapter.getMessageByFederationId.resolves({});
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onExternalThreadedFileMessageReceived({
				rawMessage: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadQuoteFileMessage.called).to.be.false;
			expect(messageAdapter.sendThreadFileMessage.called).to.be.false;
		});

		it('should NOT send a message if the sender does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			messageAdapter.getMessageByFederationId.resolves({});
			await service.onExternalThreadedFileMessageReceived({
				rawMessage: 'text',
				thread: { rootEventId: 'rootEventId' },
			} as any);

			expect(messageAdapter.sendThreadQuoteFileMessage.called).to.be.false;
			expect(messageAdapter.sendThreadFileMessage.called).to.be.false;
		});

		it('should send a message if the room and the sender already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getReadStreamForFileFromUrl.resolves();

			const files = [{ id: 'fileId', name: 'filename' }];
			const attachments = ['attachment', 'attachment2'];
			fileAdapter.uploadFile.resolves({ files, attachments } as any);
			messageAdapter.getMessageByFederationId.onFirstCall().resolves({ _id: 'messageThreadId' });
			messageAdapter.getMessageByFederationId.onSecondCall().resolves(undefined);

			await service.onExternalThreadedFileMessageReceived({
				thread: { rootEventId: 'rootEventId' },
				externalEventId: 'externalEventId',
				messageBody: {
					filename: 'filename',
					size: 12,
					mimetype: 'mimetype',
					url: 'url',
				},
			} as any);

			expect(messageAdapter.sendThreadFileMessage.calledWith(user, room, files, attachments, 'externalEventId', 'messageThreadId')).to.be
				.true;
			expect(messageAdapter.sendThreadQuoteFileMessage.called).to.be.false;
		});

		describe('Quoting messages', () => {
			it('should NOT send a quote message if its necessary to quote but the message to quote does not exists', async () => {
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.resolves(undefined);
				fileAdapter.uploadFile.resolves({} as any);

				messageAdapter.getMessageByFederationId.onFirstCall().resolves({ _id: 'messageThreadId' });
				messageAdapter.getMessageByFederationId.onSecondCall().resolves(undefined);
				messageAdapter.getMessageByFederationId.onThirdCall().resolves(undefined);
				await service.onExternalThreadedFileMessageReceived({
					thread: { rootEventId: 'rootEventId' },
					externalEventId: 'externalEventId',
					replyToEventId: 'replyToEventId',
					messageBody: {
						filename: 'filename',
						size: 12,
						mimetype: 'mimetype',
						url: 'url',
					},
				} as any);

				expect(messageAdapter.sendThreadQuoteFileMessage.called).to.be.false;
				expect(messageAdapter.sendThreadFileMessage.called).to.be.false;
			});

			it('should send a quote message if its necessary to quote and the message to quote exists', async () => {
				const messageToReplyTo = { federation: { eventId: 'eventId' } } as any;
				roomAdapter.getFederatedRoomByExternalId.resolves(room);
				userAdapter.getFederatedUserByExternalId.resolves(user);
				messageAdapter.getMessageByFederationId.onFirstCall().resolves({ _id: 'messageThreadId' });
				messageAdapter.getMessageByFederationId.onSecondCall().resolves(undefined);
				messageAdapter.getMessageByFederationId.onThirdCall().resolves(messageToReplyTo);
				const files = [{ id: 'fileId', name: 'filename' }];
				const attachments = ['attachment', 'attachment2'];
				fileAdapter.uploadFile.resolves({ files, attachments } as any);

				await service.onExternalThreadedFileMessageReceived({
					thread: { rootEventId: 'rootEventId' },
					externalEventId: 'externalEventId',
					replyToEventId: 'replyToEventId',
					messageBody: {
						filename: 'filename',
						size: 12,
						mimetype: 'mimetype',
						url: 'url',
					},
				} as any);

				expect(
					messageAdapter.sendThreadQuoteFileMessage.calledWith(
						user,
						room,
						files,
						attachments,
						'externalEventId',
						messageToReplyTo,
						'localDomain',
						'messageThreadId',
					),
				).to.be.true;
				expect(messageAdapter.sendThreadFileMessage.called).to.be.false;
			});
		});
	});
});
