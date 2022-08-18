/* eslint-disable import/first */
import { expect } from 'chai';
import sinon from 'sinon';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import proxyquire from 'proxyquire';

const { FederationRoomServiceListener } = proxyquire
	.noCallThru()
	.load('../../../../../../../app/federation-v2/server/application/RoomServiceListener', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../app/federation-v2/server/domain/FederatedUser', {
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
	.load('../../../../../../../app/federation-v2/server/domain/FederatedRoom', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

import { EVENT_ORIGIN } from '../../../../../../../app/federation-v2/server/domain/IFederationBridge';

describe('Federation - Application - FederationRoomServiceListener', () => {
	let service: typeof FederationRoomServiceListener;
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
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
	};
	const messageAdapter = {
		sendMessage: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		extractHomeserverOrigin: sinon.stub().returns('localDomain'),
		joinRoom: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationRoomServiceListener(
			roomAdapter as any,
			userAdapter as any,
			messageAdapter as any,
			settingsAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.createFederatedRoomForDirectMessage.reset();
		roomAdapter.removeDirectMessageRoom.reset();
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.updateRoomType.reset();
		roomAdapter.updateRoomName.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.updateRoomTopic.reset();
		roomAdapter.removeUserFromRoom.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		roomAdapter.getInternalRoomById.reset();
		roomAdapter.addUserToRoom.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.createFederatedUser.reset();
		messageAdapter.sendMessage.reset();
		bridge.extractHomeserverOrigin.reset();
		bridge.joinRoom.reset();
	});

	describe('#onCreateRoom()', () => {
		const creator = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});

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

		it('should NOT create the creator user if it already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.resolves(creator);
			await service.onCreateRoom({} as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the creator user if it does not exists yet', async () => {
			const creator = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(creator);
			await service.onCreateRoom({ externalInviterId: 'externalInviterId', normalizedInviterId: 'normalizedInviterId' } as any);

			expect(userAdapter.createFederatedUser.calledWith(creator)).to.be.true;
		});

		it('should throw an error if the creator was not found', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await expect(
				service.onCreateRoom({ externalInviterId: 'externalInviterId', normalizedInviterId: 'normalizedInviterId' } as any),
			).to.be.rejectedWith('Creator user not found');
		});

		it('should create the room if it does not exists yet', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(creator);
			await service.onCreateRoom({
				externalInviterId: 'externalInviterId',
				normalizedInviterId: 'normalizedInviterId',
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				externalRoomName: 'externalRoomName',
			} as any);

			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', creator, RoomType.CHANNEL, 'externalRoomName');
			expect(roomAdapter.createFederatedRoom.calledWith(room)).to.be.true;
		});
	});

	describe('#onChangeRoomMembership()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
		it('should throw an error if the room does not exists AND the event was originally from LOCAL', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);

			await expect(
				service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any),
			).to.be.rejectedWith('Could not find room with external room id: externalRoomId');
		});

		it('should NOT throw an error if the room already exists AND event origin is equal to LOCAL', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);

			await expect(service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any)).not.to.be
				.rejected;
		});

		it('should NOT throw an error if the room already exists AND event origin is equal to REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);

			await expect(service.onChangeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.REMOTE } as any)).not.to.be
				.rejected;
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
			userAdapter.getFederatedUserByExternalId.resolves({ ...user, username: 'normalizedInviteeId' } as any);
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

		it('should create a room for DM if the room type is equal a direct message', async () => {
			const inviter = user;
			const invitee = user;
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
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
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should create a room (not DM) if the room type is NOT equal a direct message', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(invitee);
			await service.onChangeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
				externalRoomName: 'externalRoomName',
			} as any);

			const createdRoom = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', invitee, RoomType.CHANNEL, 'externalRoomName');

			expect(roomAdapter.createFederatedRoom.calledWith(createdRoom)).to.be.true;
			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
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

		it('should throw an error if the federated room was not found and the event is REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.resolves(user);

			await expect(
				service.onChangeRoomMembership({
					externalRoomId: 'externalRoomId',
					normalizedRoomId: 'normalizedRoomId',
					eventOrigin: EVENT_ORIGIN.REMOTE,
					roomType: RoomType.CHANNEL,
					externalInviteeId: 'externalInviteeId',
					normalizedInviteeId: 'normalizedInviteeId',
				} as any),
			).to.be.rejectedWith('Could not find room with external room id: externalRoomId');
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

		it('should add the user from room if its NOT a LEAVE event', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
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
			expect(roomAdapter.addUserToRoom.calledWith(room, user, user)).to.be.true;
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

		it('should send a message if the room and the sender already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			await service.onExternalMessageReceived({
				messageText: 'text',
			} as any);

			expect(messageAdapter.sendMessage.calledWith({}, {}, 'text')).to.be.true;
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
		});

		it('should NOT change the room name if it exists and is a direct message', async () => {
			const dmRoom = DirectMessageFederatedRoom.createInstance('externalRoomId', user, [user, user]);
			roomAdapter.getFederatedRoomByExternalId.resolves(dmRoom);
			await service.onChangeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
		});

		it('should change the room name if it exists and is NOT a direct message', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			await service.onChangeRoomName({
				normalizedRoomName: 'normalizedRoomName2',
			} as any);
			room.changeRoomName('normalizedRoomName2');

			expect(roomAdapter.updateRoomName.calledWith(room, user)).to.be.true;
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
});
