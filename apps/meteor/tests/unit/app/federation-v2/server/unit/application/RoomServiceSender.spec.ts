import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import sinon from 'sinon';

import { FederationRoomServiceSender } from '../../../../../../../app/federation-v2/server/application/RoomServiceSender';
import { FederatedUser } from '../../../../../../../app/federation-v2/server/domain/FederatedUser';
import { FederatedRoom } from '../../../../../../../app/federation-v2/server/domain/FederatedRoom';

describe('Federation - Application - FederationRoomServiceSender', () => {
	let service: FederationRoomServiceSender;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		getFederatedRoomByInternalId: sinon.stub(),
		createFederatedRoomForDirectMessage: sinon.stub(),
		removeUserFromRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
		getInternalRoomById: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		isUserAlreadyJoined: sinon.stub(),
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
		createDirectMessageRoom: sinon.stub(),
		joinRoom: sinon.stub(),
		leaveRoom: sinon.stub(),
	};
	const room = FederatedRoom.build();
	const user = FederatedUser.build();
	user.internalReference = {
		name: 'test',
		username: 'test',
	} as any;

	beforeEach(() => {
		service = new FederationRoomServiceSender(roomAdapter as any, userAdapter as any, settingsAdapter as any, bridge as any);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.createFederatedRoomForDirectMessage.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.getInternalRoomById.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		settingsAdapter.getHomeServerDomain.reset();
		bridge.isUserIdFromTheSameHomeserver.reset();
		bridge.sendMessage.reset();
		bridge.createUser.reset();
		bridge.createDirectMessageRoom.reset();
		bridge.inviteToRoom.reset();
		bridge.joinRoom.reset();
		bridge.leaveRoom.reset();
	});

	describe('#createDirectMessageRoomAndInviteUser()', () => {
		it('should NOT create the inviter user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.createDirectMessageRoomAndInviteUser({} as any);

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
			await service.createDirectMessageRoomAndInviteUser({ externalInviterId: 'externalInviterId' } as any);
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
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			userAdapter.getInternalUserById.resolves(user);
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
			} as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee user internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.onCall(1).resolves(user);
			userAdapter.getInternalUserById.resolves(user);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
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

		it('should NOT create the room if it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			userAdapter.getInternalUserById.resolves(user);
			settingsAdapter.getHomeServerDomain.returns('domain');
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
			} as any);

			expect(roomAdapter.createFederatedRoomForDirectMessage.called).to.be.false;
		});

		it('should create the room both externally and internally if it does not exists', async () => {
			const inviter = { ...user, externalId: 'externalInviterId' } as any;
			const invitee = { ...user, externalId: 'externalInviteeId' } as any;
			userAdapter.getFederatedUserByInternalId.resolves(inviter);
			userAdapter.getFederatedUserByInternalUsername.resolves(invitee);
			roomAdapter.getInternalRoomById.resolves({ _id: 'internalRoomId', t: RoomType.CHANNEL, name: 'roomName', topic: 'topic' } as any);
			userAdapter.getInternalUserById.resolves(user);
			settingsAdapter.getHomeServerDomain.returns('domain');
			bridge.createUser.resolves('externalInviterId');
			bridge.createDirectMessageRoom.resolves('externalRoomId');
			roomAdapter.getFederatedRoomByInternalId.onCall(0).resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.onCall(1).resolves(room);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
			} as any);
			const roomResult = FederatedRoom.createInstance('externalRoomId', 'externalRoomId', user as any, RoomType.DIRECT_MESSAGE, '', [
				inviter,
				invitee,
			]);

			expect(bridge.createDirectMessageRoom.calledWith('externalInviterId', ['externalInviteeId'])).to.be.true;
			expect(roomAdapter.createFederatedRoom.calledWith(roomResult)).to.be.true;
		});

		it('should create, invite and join the user to the room in the proxy home server if the invitee is from the same homeserver', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ ...user, externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			roomAdapter.getInternalRoomById.resolves({ _id: 'internalRoomId', t: RoomType.CHANNEL, name: 'roomName', topic: 'topic' } as any);
			userAdapter.getInternalUserById.resolves(user);
			room.externalId = 'externalRoomId';
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			settingsAdapter.getHomeServerDomain.returns('domain');
			bridge.isUserIdFromTheSameHomeserver.returns(true);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.createDirectMessageRoomAndInviteUser({
				normalizedInviteeId: 'normalizedInviteeId',
				rawInviteeId: 'rawInviteeId',
				inviteeUsernameOnly: 'inviteeUsernameOnly',
			} as any);

			expect(bridge.createUser.calledWith('inviteeUsernameOnly', 'usernameInvitee', 'domain')).to.be.true;
			expect(bridge.inviteToRoom.calledWith('externalRoomId', 'externalInviterId', 'externalInviteeId')).to.be.true;
			expect(bridge.joinRoom.calledWith('externalRoomId', 'externalInviteeId')).to.be.true;
		});

		it('should NOT invite any user externally if the user is not from the same home server AND it was already invited when creating the room', async () => {
			userAdapter.getFederatedUserByInternalId.resolves({ ...user, externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.isUserIdFromTheSameHomeserver.returns(false);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
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
			userAdapter.getFederatedUserByInternalId.resolves({ ...user, externalId: 'externalInviterId' } as any);
			userAdapter.getFederatedUserByInternalUsername.resolves({
				externalId: 'externalInviteeId',
				internalReference: { name: 'usernameInvitee' },
			} as any);
			room.internalReference = {} as any;
			room.internalReference.t = RoomType.DIRECT_MESSAGE;
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.isUserIdFromTheSameHomeserver.returns(false);
			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
			await service.createDirectMessageRoomAndInviteUser({
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
			userAdapter.getFederatedUserByInternalId.resolves({ ...user, externalId: 'externalId' } as any);
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

	describe('#leaveRoom()', () => {
		it('should not remove the user from the proxy server if it is not in the room anymore', async () => {
			roomAdapter.isUserAlreadyJoined.resolves(false);
			await service.leaveRoom({} as any);
			expect(bridge.leaveRoom.called).to.be.false;
		});

		it('should not remove the user from the proxy server if the room does not exists', async () => {
			roomAdapter.isUserAlreadyJoined.resolves(true);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.leaveRoom({} as any);
			expect(bridge.leaveRoom.called).to.be.false;
		});

		it('should not remove the user from the proxy server if the user does not exists', async () => {
			roomAdapter.isUserAlreadyJoined.resolves(true);
			roomAdapter.getFederatedRoomByInternalId.resolves({});
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.leaveRoom({} as any);
			expect(bridge.leaveRoom.called).to.be.false;
		});

		it('should remove the user from the proxy server room if the room and the user exists AND it is in the local room', async () => {
			roomAdapter.isUserAlreadyJoined.resolves(true);
			roomAdapter.getFederatedRoomByInternalId.resolves({ externalId: 'externalId' });
			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalId' });
			await service.leaveRoom({} as any);
			expect(bridge.leaveRoom.calledWith('externalId', 'externalId')).to.be.true;
		});
	});

	describe('#beforeCreateDirectMessageFromUI()', () => {
		it('should throw an error if there at least one user with federated: true', async () => {
			try {
				await service.beforeCreateDirectMessageFromUI([{ federated: true } as any, {} as any]);
			} catch (e: any) {
				expect(e.message).to.be.equal('error-this-is-an-ee-feature');
			}
		});

		it('should throw an error if there at least one new external user', async () => {
			try {
				await service.beforeCreateDirectMessageFromUI(['@myexternal:external.com', {} as any]);
			} catch (e: any) {
				expect(e.message).to.be.equal('error-this-is-an-ee-feature');
			}
		});
	});
});
