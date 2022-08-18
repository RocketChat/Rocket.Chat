import { expect } from 'chai';
import sinon from 'sinon';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederationRoomServiceReceiver } from '../../../../../../../app/federation-v2/server/application/RoomServiceReceiver';
import { FederatedUser } from '../../../../../../../app/federation-v2/server/domain/FederatedUser';
import { FederatedRoom } from '../../../../../../../app/federation-v2/server/domain/FederatedRoom';
import { EVENT_ORIGIN } from '../../../../../../../app/federation-v2/server/domain/IFederationBridge';

describe('Federation - Application - FederationRoomServiceReceiver', () => {
	let service: FederationRoomServiceReceiver;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		removeUserFromRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
		isUserAlreadyJoined: sinon.stub(),
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
		getHomeServerDomain: sinon.stub(),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		isUserIdFromTheSameHomeserver: sinon.stub(),
		joinRoom: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationRoomServiceReceiver(
			roomAdapter as any,
			userAdapter as any,
			messageAdapter as any,
			settingsAdapter as any,
			bridge as any,
		);
	});
	const room = FederatedRoom.build();

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.removeUserFromRoom.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		roomAdapter.addUserToRoom.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.createFederatedUser.reset();
		messageAdapter.sendMessage.reset();
		settingsAdapter.getHomeServerDomain.reset();
		bridge.isUserIdFromTheSameHomeserver.reset();
		bridge.joinRoom.reset();
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.updateRoomType.reset();
		roomAdapter.updateRoomName.reset();
		roomAdapter.updateRoomTopic.reset();
	});

	describe('#createRoom()', () => {
		it('should NOT create users nor room if the room already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			await service.createRoom({} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should NOT create users nor room if the room was created internally and programatically', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			await service.createRoom({ wasInternallyProgramaticallyCreated: true } as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should NOT create the creator if it already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			await service.createRoom({} as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the creator if it does not exists yet', async () => {
			const creator = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(creator);
			await service.createRoom({ externalInviterId: 'externalInviterId', normalizedInviterId: 'normalizedInviterId' } as any);

			expect(userAdapter.createFederatedUser.calledWith(creator)).to.be.true;
		});

		it('should create the room if it does not exists yet', async () => {
			const creator = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(creator);
			await service.createRoom({
				externalInviterId: 'externalInviterId',
				normalizedInviterId: 'normalizedInviterId',
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				externalRoomName: 'externalRoomName',
			} as any);

			const room = FederatedRoom.createInstance(
				'externalRoomId',
				'normalizedRoomId',
				creator as FederatedUser,
				RoomType.CHANNEL,
				'externalRoomName',
			);
			expect(roomAdapter.createFederatedRoom.calledWith(room)).to.be.true;
		});
	});

	describe('#changeRoomMembership()', () => {
		it('should throw an error if the room does not exists AND event origin is equal to LOCAL', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			try {
				await service.changeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Could not find room with external room id: externalRoomId');
			}
		});

		it('should NOT throw an error if the room already exists AND event origin is equal to LOCAL', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);

			expect(bridge.isUserIdFromTheSameHomeserver.called).to.be.true;
		});

		it('should NOT throw an error if the room already exists AND event origin is equal to REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.REMOTE } as any);

			expect(bridge.isUserIdFromTheSameHomeserver.called).to.be.true;
		});

		it('should NOT create the inviter if it already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves({} as any);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves({} as any);
			await service.changeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the inviter if it does not exists', async () => {
			const inviter = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(undefined);
			bridge.isUserIdFromTheSameHomeserver.onCall(0).returns(false);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				externalInviterId: 'externalInviterId',
				normalizedInviterId: 'normalizedInviterId',
			} as any);

			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
		});

		it('should NOT create the invitee if it already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves({} as any);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(undefined);
			await service.changeRoomMembership({ externalRoomId: 'externalRoomId', eventOrigin: EVENT_ORIGIN.LOCAL } as any);

			expect(userAdapter.createFederatedUser.calledOnce).to.be.true;
		});

		it('should create the invitee if it does not exists', async () => {
			const invitee = FederatedUser.createInstance('externalInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves({} as any);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(undefined);
			bridge.isUserIdFromTheSameHomeserver.onCall(1).returns(false);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should create the room if it does not exists yet AND the event origin is REMOTE', async () => {
			const inviter = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			const invitee = inviter;
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			bridge.isUserIdFromTheSameHomeserver.onCall(1).returns(false);
			userAdapter.getFederatedUserByExternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(1).resolves(undefined);
			userAdapter.getFederatedUserByExternalId.onCall(2).resolves(inviter);
			userAdapter.getFederatedUserByExternalId.onCall(3).resolves(invitee);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', inviter as FederatedUser, RoomType.CHANNEL, '', [
				inviter,
				invitee,
			] as FederatedUser[]);
			expect(roomAdapter.createFederatedRoom.calledWith(room)).to.be.true;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should NOT create the room if it already exists yet AND the event origin is REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.REMOTE,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should NOT create the room if it already exists yet AND the event origin is REMOTE', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should remove the user from room if its a LEAVE event and the user is in the room', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			roomAdapter.isUserAlreadyJoined.resolves(true);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: true,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.called).to.be.true;
			expect(roomAdapter.addUserToRoom.called).to.be.false;
		});

		it('should NOT remove the user from room if its a LEAVE event and the user is NOT in the room anymore', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			roomAdapter.isUserAlreadyJoined.resolves(false);
			await service.changeRoomMembership({
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

		it('should add the user from room if its NOT a LEAVE event', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomMembership({
				externalRoomId: 'externalRoomId',
				normalizedRoomId: 'normalizedRoomId',
				eventOrigin: EVENT_ORIGIN.LOCAL,
				roomType: RoomType.CHANNEL,
				externalInviteeId: 'externalInviteeId',
				leave: false,
				normalizedInviteeId: 'normalizedInviteeId',
			} as any);

			expect(roomAdapter.removeUserFromRoom.called).to.be.false;
			expect(roomAdapter.addUserToRoom.called).to.be.true;
		});
	});

	describe('#receiveExternalMessage()', () => {
		it('should NOT send a message if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.receiveExternalMessage({
				text: 'text',
			} as any);

			expect(messageAdapter.sendMessage.called).to.be.false;
		});

		it('should NOT send a message if the sender does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await service.receiveExternalMessage({
				text: 'text',
			} as any);

			expect(messageAdapter.sendMessage.called).to.be.false;
		});

		it('should send a message if the room and the sender already exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({} as any);
			userAdapter.getFederatedUserByExternalId.resolves({} as any);
			await service.receiveExternalMessage({
				text: 'text',
			} as any);

			expect(messageAdapter.sendMessage.calledWith({}, 'text', {})).to.be.true;
		});
	});

	describe('#changeJoinRules()', () => {
		it('should NOT change the room type if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.changeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);

			expect(roomAdapter.updateRoomType.called).to.be.false;
		});

		it('should NOT change the room type if it exists and is a direct message', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);

			expect(roomAdapter.updateRoomType.called).to.be.false;
		});

		it('should change the room type if it exists and is NOT a direct message', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.PRIVATE_GROUP;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeJoinRules({
				roomType: RoomType.CHANNEL,
			} as any);
			room.internalReference.t = RoomType.CHANNEL;
			expect(roomAdapter.updateRoomType.calledWith(room)).to.be.true;
		});
	});

	describe('#changeRoomName()', () => {
		it('should NOT change the room name if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.changeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
		});

		it('should NOT change the room name if it exists and is a direct message', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomName({
				normalizedRoomName: 'normalizedRoomName',
			} as any);

			expect(roomAdapter.updateRoomName.called).to.be.false;
		});

		it('should change the room name if it exists and is NOT a direct message', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.PRIVATE_GROUP;
			room.internalReference.name = 'name';
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves({});
			await service.changeRoomName({
				normalizedRoomName: 'normalizedRoomName2',
			} as any);
			expect(roomAdapter.updateRoomName.called).to.be.true;
		});
	});

	describe('#changeRoomTopic()', () => {
		it('should NOT change the room topic if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.changeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);

			expect(roomAdapter.updateRoomTopic.called).to.be.false;
		});

		it('should NOT change the room topic if it exists and is a direct message', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			await service.changeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);

			expect(roomAdapter.updateRoomTopic.called).to.be.false;
		});

		it('should change the room topic if it exists and is NOT a direct message', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.PRIVATE_GROUP;
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUserByExternalId.resolves({});
			await service.changeRoomTopic({
				roomTopic: 'roomTopic',
			} as any);
			room.internalReference.topic = 'roomTopic';
			expect(roomAdapter.updateRoomTopic.called).to.be.true;
		});
	});
});
