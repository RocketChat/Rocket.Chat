// import { expect } from 'chai';
// import sinon from 'sinon';
// import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

// import { FederationRoomServiceSenderEE } from '../../../../../../app/federation-v2/server/application/RoomServiceSender';
// import { FederatedRoomEE } from '../../../../../../app/federation-v2/server/domain/FederatedRoom';
// import { FederatedUserEE } from '../../../../../../app/federation-v2/server/domain/FederatedUser';

// describe('FederationEE - Application - FederationRoomServiceSenderEE', () => {
// 	let service: FederationRoomServiceSenderEE;
// 	const roomAdapter = {
// 		getFederatedRoomByInternalId: sinon.stub(),
// 		createFederatedRoom: sinon.stub(),
// 		updateFederatedRoomByInternalRoomId: sinon.stub(),
// 		addUserToRoom: sinon.stub(),
// 		getInternalRoomById: sinon.stub(),
// 		isUserAlreadyJoined: sinon.stub(),
// 	};
// 	const userAdapter = {
// 		getFederatedUserByInternalId: sinon.stub(),
// 		createFederatedUser: sinon.stub(),
// 		getInternalUserById: sinon.stub(),
// 		getFederatedUserByInternalUsername: sinon.stub(),
// 		createLocalUser: sinon.stub(),
// 	};
// 	const settingsAdapter = {
// 		getHomeServerDomain: sinon.stub(),
// 	};
// 	const bridge = {
// 		getUserProfileInformation: sinon.stub().resolves({}),
// 		isUserIdFromTheSameHomeserver: sinon.stub(),
// 		createUser: sinon.stub(),
// 		inviteToRoom: sinon.stub().returns(new Promise((resolve) => resolve({}))),
// 		createRoom: sinon.stub(),
// 		createDirectMessageRoom: sinon.stub(),
// 		joinRoom: sinon.stub(),
// 	};
// 	const notificationAdapter = {};
// 	const room = FederatedRoomEE.build();
// 	const user = FederatedUserEE.build();
// 	user.internalReference = {
// 		_id: 'id',
// 		username: 'marcos.defendi',
// 	} as any;
// 	const invitees = [
// 		{
// 			inviteeUsernameOnly: 'marcos.defendi',
// 			normalizedInviteeId: 'marcos.defendi:matrix.com',
// 			rawInviteeId: '@marcos.defendi:matrix.com',
// 		},
// 	];

// 	beforeEach(() => {
// 		service = new FederationRoomServiceSenderEE(
// 			roomAdapter as any,
// 			userAdapter as any,
// 			settingsAdapter as any,
// 			notificationAdapter as any,
// 			bridge as any,
// 		);
// 	});

// 	afterEach(() => {
// 		roomAdapter.getFederatedRoomByInternalId.reset();
// 		roomAdapter.createFederatedRoom.reset();
// 		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
// 		roomAdapter.addUserToRoom.reset();
// 		roomAdapter.getInternalRoomById.reset();
// 		roomAdapter.isUserAlreadyJoined.reset();
// 		userAdapter.getFederatedUserByInternalId.reset();
// 		userAdapter.getInternalUserById.reset();
// 		userAdapter.createFederatedUser.reset();
// 		userAdapter.getFederatedUserByInternalUsername.reset();
// 		userAdapter.createLocalUser.reset();
// 		settingsAdapter.getHomeServerDomain.reset();
// 		bridge.isUserIdFromTheSameHomeserver.reset();
// 		bridge.createUser.reset();
// 		bridge.createRoom.reset();
// 		bridge.createDirectMessageRoom.reset();
// 		bridge.inviteToRoom.reset();
// 		bridge.joinRoom.reset();
// 	});

// 	describe('#onRoomCreated()', () => {
// 		it('should NOT create the inviter user if the user already exists', async () => {
// 			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(user);
// 			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.onRoomCreated({ invitees: [] } as any);

// 			expect(userAdapter.createFederatedUser.called).to.be.false;
// 		});

// 		it('should create the inviter user both externally and internally if it does not exists', async () => {
// 			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
// 			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
// 			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			bridge.createUser.resolves('externalInviterId');
// 			await service.onRoomCreated({ invitees: [] } as any);
// 			const inviter = FederatedUserEE.createInstance('externalInviterId', {
// 				name: 'name',
// 				username: 'username',
// 				existsOnlyOnProxyServer: true,
// 			});
// 			expect(bridge.createUser.calledWith('username', 'name', 'domain')).to.be.true;
// 			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
// 		});

// 		it('should NOT create the room if it already exists', async () => {
// 			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(user);
// 			userAdapter.getFederatedUserByInternalId.onCall(1).resolves({} as any);
// 			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.onRoomCreated({ invitees: [] } as any);

// 			expect(roomAdapter.createFederatedRoom.called).to.be.false;
// 		});

// 		it('should create the room both externally and internally if it does not exists', async () => {
// 			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
// 			roomAdapter.getInternalRoomById.resolves({ _id: 'internalRoomId', t: RoomType.CHANNEL, name: 'roomName', topic: 'topic' } as any);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			bridge.createUser.resolves('externalInviterId');
// 			bridge.createRoom.resolves('externalRoomId');
// 			roomAdapter.getFederatedRoomByInternalId.onCall(0).resolves(undefined);
// 			roomAdapter.getFederatedRoomByInternalId.onCall(1).resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.onRoomCreated({ invitees: [] } as any);
// 			const roomResult = FederatedRoomEE.createInstanceEE(
// 				'externalRoomId',
// 				'externalRoomId',
// 				{ externalId: 'externalInviterId' } as any,
// 				RoomType.CHANNEL,
// 				'roomName',
// 			);

// 			expect(bridge.createRoom.calledWith('externalInviterId', RoomType.CHANNEL, 'roomName', 'topic')).to.be.true;
// 			expect(roomAdapter.updateFederatedRoomByInternalRoomId.calledWith('internalRoomId', roomResult)).to.be.true;
// 		});

// 		it('should throw an error if the room does not exists', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(true);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.onCall(0).resolves(room);
// 			roomAdapter.getFederatedRoomByInternalId.onCall(1).resolves(undefined);
// 			try {
// 				await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId' } as any);
// 			} catch (e: any) {
// 				expect(e.message).to.be.equal('Could not find the room to invite. RoomId: internalRoomId');
// 			}
// 		});

// 		it('should NOT create the invitee (from the same homeserver) user if the user already exists', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(true);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.resolves(user);
// 			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId' } as any);

// 			expect(userAdapter.createFederatedUser.called).to.be.false;
// 		});

// 		it('should create the invitee (from the same homeserver) user internally if it does not exists', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(true);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
// 			userAdapter.getFederatedUserByInternalUsername.onCall(1).resolves(user);
// 			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

// 			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
// 				name: invitees[0].inviteeUsernameOnly,
// 				username: invitees[0].inviteeUsernameOnly,
// 				existsOnlyOnProxyServer: true,
// 			});

// 			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
// 		});

// 		it('should NOT create the invitee (from a different homeserver) user if the user already exists', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(false);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.resolves(user);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId' } as any);

// 			expect(userAdapter.createFederatedUser.called).to.be.false;
// 		});

// 		it('should create the invitee (from a different homeserver)  user internally if it does not exists', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(false);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
// 			userAdapter.getFederatedUserByInternalUsername.onCall(1).resolves(user);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

// 			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
// 				name: invitees[0].normalizedInviteeId,
// 				username: invitees[0].normalizedInviteeId,
// 				existsOnlyOnProxyServer: false,
// 			});

// 			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
// 		});

// 		it('should invite the user to the room in the proxy home server if the invitee is from a different homeserver', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(false);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			room.externalId = 'externalRoomId';
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
// 			userAdapter.getFederatedUserByInternalUsername.onCall(1).resolves(user);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

// 			expect(bridge.inviteToRoom.calledWith('externalRoomId', undefined, undefined)).to.be.true;
// 		});
// 	});

// 	describe('#onDirectMessageRoomCreation()', () => {
// 		it('should create the inviter user both externally and internally if it does not exists', async () => {
// 			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
// 			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
// 			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			bridge.createUser.resolves('externalInviterId');
// 			await service.onDirectMessageRoomCreation({ invitees } as any);
// 			const inviter = FederatedUserEE.createInstance('externalInviterId', {
// 				name: 'name',
// 				username: 'username',
// 				existsOnlyOnProxyServer: true,
// 			});
// 			expect(bridge.createUser.calledWith('username', 'name', 'domain')).to.be.true;
// 			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
// 		});

// 		it('should create the external room with all the invitees when the inviter is from the same homeserver', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(true);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			userAdapter.getFederatedUserByInternalUsername.resolves(user);
// 			room.externalId = 'externalRoomId';
// 			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
// 			await service.onDirectMessageRoomCreation({ invitees } as any);

// 			expect(
// 				bridge.createDirectMessageRoom.calledWith(
// 					undefined,
// 					invitees.map((invitee) => invitee.rawInviteeId),
// 				),
// 			).to.be.true;
// 		});

// 		it('should NOT create the external room with all the invitees when the inviter is NOT from the same homeserver', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(false);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			room.externalId = 'externalRoomId';
// 			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
// 			await service.onDirectMessageRoomCreation({ invitees } as any);

// 			expect(bridge.createDirectMessageRoom.called).to.be.false;
// 		});

// 		it('should create the user on the proxy homeserver if it is from the same homeserver', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(true);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.resolves({ internalReference: { name: 'name' } });
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			await service.onDirectMessageRoomCreation({ invitees } as any);

// 			expect(bridge.createUser.calledWith(invitees[0].inviteeUsernameOnly, 'name', 'domain')).to.be.true;
// 		});

// 		it('should NOT create the user on the proxy homeserver if it is NOT from the same homeserver, which means is a external user', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.returns(false);
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			userAdapter.getFederatedUserByInternalUsername.resolves({ internalReference: { name: 'name' } });
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			await service.onDirectMessageRoomCreation({ invitees } as any);

// 			expect(bridge.createUser.called).to.be.false;
// 		});
// 	});

// 	describe('#beforeDirectMessageRoomCreation()', () => {
// 		it('should create the invitee locally for each external user', async () => {
// 			bridge.isUserIdFromTheSameHomeserver.onCall(0).returns(false);
// 			bridge.isUserIdFromTheSameHomeserver.onCall(1).returns(true);
// 			await service.beforeDirectMessageRoomCreation({
// 				invitees: [
// 					...invitees,
// 					{
// 						inviteeUsernameOnly: 'marcos.defendiNotToBeInvited',
// 						normalizedInviteeId: 'marcos.defendi:matrix.comNotToBeInvited',
// 						rawInviteeId: '@marcos.defendi:matrix.comNotToBeInvited',
// 					},
// 				],
// 			} as any);
// 			const invitee = FederatedUserEE.createInstance('', {
// 				name: invitees[0].normalizedInviteeId,
// 				username: invitees[0].normalizedInviteeId,
// 				existsOnlyOnProxyServer: false,
// 			});

// 			expect(userAdapter.createLocalUser.calledWith(invitee)).to.be.true;
// 		});
// 	});

// 	describe('#setupFederatedRoom()', () => {
// 		it('should NOT create the inviter user if the user already exists', async () => {
// 			userAdapter.getFederatedUserByInternalId.resolves(user);
// 			userAdapter.getFederatedUserByInternalUsername.resolves(user);
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.setupFederatedRoom({} as any);

// 			expect(userAdapter.createFederatedUser.called).to.be.false;
// 		});

// 		it('should create the inviter user both externally and internally if it does not exists', async () => {
// 			userAdapter.getFederatedUserByInternalUsername.resolves(user);
// 			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
// 			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
// 			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			roomAdapter.getFederatedRoomByInternalId.resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			bridge.createUser.resolves('externalInviterId');
// 			await service.setupFederatedRoom({ externalInviterId: 'externalInviterId' } as any);
// 			const inviter = FederatedUserEE.createInstance('externalInviterId', {
// 				name: 'name',
// 				username: 'username',
// 				existsOnlyOnProxyServer: true,
// 			});
// 			expect(bridge.createUser.calledWith('username', 'name', 'domain')).to.be.true;
// 			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
// 		});

// 		it('should set the room as federated if it is NOT federated yet', async () => {
// 			userAdapter.getFederatedUserByInternalId.resolves({ externalId: 'externalInviterId' } as any);
// 			userAdapter.getFederatedUserByInternalUsername.resolves({ externalId: 'externalInviteeId' } as any);
// 			roomAdapter.getInternalRoomById.resolves({ _id: 'internalRoomId', t: RoomType.CHANNEL, name: 'roomName', topic: 'topic' } as any);
// 			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
// 			settingsAdapter.getHomeServerDomain.returns('domain');
// 			bridge.createUser.resolves('externalInviterId');
// 			bridge.createRoom.resolves('externalRoomId');
// 			roomAdapter.getFederatedRoomByInternalId.onCall(0).resolves(undefined);
// 			roomAdapter.getFederatedRoomByInternalId.onCall(1).resolves(room);
// 			bridge.inviteToRoom.returns(new Promise((resolve) => resolve({})));
// 			await service.setupFederatedRoom({ normalizedInviteeId: 'normalizedInviteeId', rawInviteeId: 'rawInviteeId' } as any);
// 			const roomResult = FederatedRoomEE.createInstanceEE(
// 				'externalRoomId',
// 				'externalRoomId',
// 				{ externalId: 'externalInviterId' } as any,
// 				RoomType.CHANNEL,
// 				'roomName',
// 			);

// 			expect(bridge.createRoom.calledWith('externalInviterId', RoomType.CHANNEL, 'roomName', 'topic')).to.be.true;
// 			expect(roomAdapter.updateFederatedRoomByInternalRoomId.calledWith('internalRoomId', roomResult)).to.be.true;
// 		});
// 	});
// });
