import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { FederatedRoomEE } = proxyquire.noCallThru().load('../../../../../../../../server/local-services/federation/domain/FederatedRoom', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});
const { FederatedUserEE } = proxyquire.noCallThru().load('../../../../../../../../server/local-services/federation/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});
const { FederationRoomServiceSender } = proxyquire
	.noCallThru()
	.load('../../../../../../../../server/local-services/federation/application/room/sender/RoomServiceSender', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('FederationEE - Application - FederationRoomServiceSender', () => {
	let service: typeof FederationRoomServiceSender;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
		getInternalRoomById: sinon.stub(),
		getInternalRoomRolesByUserId: sinon.stub(),
		isUserAlreadyJoined: sinon.stub(),
		getFederatedRoomByExternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
		createLocalUser: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
		updateFederationAvatar: sinon.stub(),
		setAvatar: sinon.stub(),
		updateRealName: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
		isFederationEnabled: sinon.stub(),
		getMaximumSizeOfUsersWhenJoiningPublicRooms: sinon.stub(),
	};
	const messageAdapter = {};
	const bridge = {
		searchPublicRooms: sinon.stub(),
		getUserProfileInformation: sinon.stub().resolves({}),
		extractHomeserverOrigin: sinon.stub(),
		createUser: sinon.stub(),
		inviteToRoom: sinon.stub(),
		createRoom: sinon.stub(),
		joinRoom: sinon.stub(),
		convertMatrixUrlToHttp: sinon.stub().returns('toHttpUrl'),
		getRoomData: sinon.stub(),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub().resolves(undefined),
	};
	const notificationAdapter = {
		subscribeToUserTypingEventsOnFederatedRoomId: sinon.stub(),
		broadcastUserTypingOnRoom: sinon.stub(),
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
			settingsAdapter as any,
			messageAdapter as any,
			notificationAdapter as any,
			queueAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.getInternalRoomById.reset();
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.getInternalRoomRolesByUserId.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		userAdapter.createLocalUser.reset();
		userAdapter.getInternalUserByUsername.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.updateFederationAvatar.reset();
		userAdapter.setAvatar.reset();
		userAdapter.updateRealName.reset();
		bridge.extractHomeserverOrigin.reset();
		bridge.createUser.reset();
		bridge.createRoom.reset();
		bridge.inviteToRoom.reset();
		bridge.joinRoom.reset();
		bridge.getUserProfileInformation.reset();
		bridge.joinRoom.reset();
		bridge.searchPublicRooms.reset();
		bridge.getRoomData.reset();
		queueAdapter.enqueueJob.reset();
		settingsAdapter.isFederationEnabled.reset();
		settingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms.reset();
		notificationAdapter.broadcastUserTypingOnRoom.reset();
		notificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId.reset();
	});

	describe('#onRoomCreated()', () => {
		const user = FederatedUserEE.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

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

			const inviter = FederatedUserEE.createInstance('externalInviterId', {
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

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
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

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
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
			const invitee = FederatedUserEE.createInstance('externalInviteeId', {
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
			const invitee = FederatedUserEE.createInstance('externalInviteeId', {
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
			const invitee = FederatedUserEE.createInstance('externalInviteeId', {
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
		const federatedUser = FederatedUserEE.createInstance('externalInviteeId', {
			name: 'normalizedInviteeId',
			username: 'normalizedInviteeId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', federatedUser, RoomType.CHANNEL, 'externalRoomName');
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

		it('should create the user locally if the inviter was provided and he/she is a moderator', async () => {
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

			const invitee = FederatedUserEE.createLocalInstanceOnly({
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
				FederatedUserEE.createInstance('externalInviterId', {
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
				FederatedUserEE.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
					federation: {
						avatarUrl: 'avatarUrl',
					},
				}),
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
			const userAvatar = FederatedUserEE.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
				federation: {
					avatarUrl: 'currentAvatarUrl',
				},
				_id: 'userId',
			});
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
				FederatedUserEE.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
					name: 'displayName',
				}),
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
			const user = FederatedUserEE.createWithInternalReference('externalInviterId', existsOnlyOnProxyServer, {
				_id: 'userId',
				name: 'currentName',
			});
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
		const user = FederatedUserEE.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

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

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
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

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
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
			const invitee = FederatedUserEE.createInstance('externalInviteeId', {
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
			const invitee = FederatedUserEE.createInstance('externalInviteeId', {
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
			const invitee = FederatedUserEE.createInstance('externalInviteeId', {
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
			const user = FederatedUserEE.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

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
