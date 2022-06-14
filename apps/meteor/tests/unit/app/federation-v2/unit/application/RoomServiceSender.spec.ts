import { expect } from 'chai';
import sinon from 'sinon';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederationRoomServiceSender } from '../../../../../../app/federation-v2/server/application/RoomServiceSender';
import { FederatedUser } from '../../../../../../app/federation-v2/server/domain/FederatedUser';
import { FederatedRoom } from '../../../../../../app/federation-v2/server/domain/FederatedRoom';

describe('Federation - Application - FederationRoomServiceSender', () => {
	let service: FederationRoomServiceSender;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		getFederatedRoomByInternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
		removeUserFromRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
		getInternalRoomById: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub(),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		isUserIdFromTheSameHomeserver: sinon.stub(),
		sendMessage: sinon.stub(),
		createUser: sinon.stub(),
		inviteToRoom: sinon.stub().returns(new Promise((resolve) => resolve({}))),
		createRoom: sinon.stub(),
		joinRoom: sinon.stub(),
	};
	const notificationAdapter = {};
	const room = FederatedRoom.build();
	const user = FederatedRoom.build();

	beforeEach(() => {
		service = new FederationRoomServiceSender(
			roomAdapter as any,
			userAdapter as any,
			settingsAdapter as any,
			notificationAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.getInternalRoomById.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		settingsAdapter.getHomeServerDomain.reset();
		bridge.isUserIdFromTheSameHomeserver.reset();
		bridge.sendMessage.reset();
		bridge.createUser.reset();
		bridge.createRoom.reset();
		bridge.inviteToRoom.reset();
		bridge.joinRoom.reset();
	});

	describe('#inviteUserToAFederatedRoom()', () => {
		it('should NOT create the inviter user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({} as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the inviter user both externally and internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			bridge.createUser.resolves('externalInviterId');
			await service.inviteUserToAFederatedRoom({ externalInviterId: 'externalInviterId' } as any);
			const inviter = FederatedUser.createInstance('externalInviterId', {
				name: 'name',
				username: 'username',
				existsOnlyOnProxyServer: true,
			});
			expect(bridge.createUser.calledWith('username', 'name', 'domain')).to.be.true;
			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
		});

		it('should NOT create the invitee user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves({} as any);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({ normalizedInviteeId: 'normalizedInviteeId', rawInviteeId: 'rawInviteeId' } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee user internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.onCall(1).resolves({} as any);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.inviteUserToAFederatedRoom({ normalizedInviteeId: 'normalizedInviteeId', rawInviteeId: 'rawInviteeId' } as any);
			const invitee = FederatedUser.createInstance('rawInviteeId', {
				name: 'normalizedInviteeId',
				username: 'normalizedInviteeId',
				existsOnlyOnProxyServer: false,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should NOT create the room if it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves({} as any);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({ normalizedInviteeId: 'normalizedInviteeId', rawInviteeId: 'rawInviteeId' } as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should create the room both externally and internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({ externalId: 'externalInviteeId' } as any);
			roomAdapter.getInternalRoomById.resolves({ _id: 'internalRoomId', t: RoomType.CHANNEL, name: 'roomName', topic: 'topic' } as any);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			settingsAdapter.getHomeServerDomain.returns('domain');
			bridge.createUser.resolves('externalInviterId');
			bridge.createRoom.resolves('externalRoomId');
			roomAdapter.getFederatedRoomByInternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.onCall(1).resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({ normalizedInviteeId: 'normalizedInviteeId', rawInviteeId: 'rawInviteeId' } as any);
			const roomResult = FederatedRoom.createInstance('externalRoomId', 'externalRoomId', user as any, RoomType.CHANNEL, 'roomName');

			expect(bridge.createRoom.calledWith('externalInviterId', 'externalInviteeId', RoomType.CHANNEL, 'roomName', 'topic')).to.be.true;
			expect(roomAdapter.updateFederatedRoomByInternalRoomId.calledWith('internalRoomId', roomResult)).to.be.true;
		});

		it('should create, invite and join the user to the room in the proxy home server if the invitee is from the same homeserver', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			roomAdapter.getInternalRoomById.resolves({ _id: 'internalRoomId', t: RoomType.CHANNEL, name: 'roomName', topic: 'topic' } as any);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			room.externalId = 'externalRoomId';
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			settingsAdapter.getHomeServerDomain.returns('domain');
			bridge.isUserIdFromTheSameHomeserver.resolves(true);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(bridge.createUser.calledWith('inviteeUsernameOnly', 'usernameInvitee', 'domain')).to.be.true;
			expect(bridge.inviteToRoom.calledWith('externalRoomId', 'externalInviterId', 'externalInviteeId')).to.be.true;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should invite the user to an external room if the room is NOT direct message(on DMs, they are invited during the creational process)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			roomAdapter.getInternalRoomById.resolves({
				_id: 'internalRoomId',
				t: RoomType.DIRECT_MESSAGE,
				name: 'roomName',
				topic: 'topic',
			} as any);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			room.externalId = 'externalRoomId';
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.isUserIdFromTheSameHomeserver.resolves(false);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(bridge.inviteToRoom.calledWith('externalRoomId', 'externalInviterId', 'externalInviteeId')).to.be.true;
		});

		it('should NOT invite any user externally if the user is not from the same home server AND it was already invited when creating the room', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.isUserIdFromTheSameHomeserver.resolves(false);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(bridge.inviteToRoom.called).to.be.false;
			expect(bridge.createUser.called).to.be.false;
			expect(bridge.joinRoom.called).to.be.false;
		});

		it('should always add the user to the internal room', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.isUserIdFromTheSameHomeserver.resolves(false);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.inviteUserToAFederatedRoom({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(roomAdapter.addUserToRoom.called).to.be.true;
		});
	});

	describe('#sendMessageFromRocketChat()', () => {
		it('should throw an error if the sender does not exists ', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			try {
				await service.sendMessageFromRocketChat({ internalSenderId: 'internalSenderId' } as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Could not find user id for internalSenderId');
			}
		});

		it('should throw an error if the room does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({} as any);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			try {
				await service.sendMessageFromRocketChat({ internalRoomId: 'internalRoomId' } as any);
			} catch (e: any) {
				expect(e.message).to.be.equal('Could not find room id for internalRoomId');
			}
		});

		it('should send the message through the bridge', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalId' } as any);
			roomAdapter.getFederatedRoomByInternalId.resolves({ externalId: 'externalId' } as any);
			await service.sendMessageFromRocketChat({ message: { msg: 'text' } } as any);
			expect(bridge.sendMessage.calledWith('externalId', 'externalId', 'text')).to.be.true;
		});
	});

	describe('#isAFederatedRoom()', () => {
		it('should return false if internalRoomId is undefined', async () => {
			expect(await service.isAFederatedRoom('')).to.be.false;
		});

		it('should return false if the room does not exist', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			expect(await service.isAFederatedRoom('')).to.be.false;
		});

		it('should return true if the room is NOT federated', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.federated = false;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			expect(await service.isAFederatedRoom('internalRoomId')).to.be.false;
		});

		it('should return true if the room is federated', async () => {
			const room = FederatedRoom.build();
			room.internalReference = {} as any;
			room.internalReference.federated = true;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			expect(await service.isAFederatedRoom('internalRoomId')).to.be.true;
		});
	});
});
