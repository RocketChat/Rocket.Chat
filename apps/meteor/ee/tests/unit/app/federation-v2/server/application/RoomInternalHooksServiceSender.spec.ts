/* eslint-disable import/first */
import { expect } from 'chai';
import sinon from 'sinon';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import proxyquire from 'proxyquire';

const { FederatedRoomEE } = proxyquire.noCallThru().load('../../../../../../app/federation-v2/server/domain/FederatedRoom', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});
const { FederatedUserEE } = proxyquire.noCallThru().load('../../../../../../app/federation-v2/server/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});
const { FederationRoomInternalHooksServiceSender } = proxyquire
	.noCallThru()
	.load('../../../../../../app/federation-v2/server/application/sender/room/RoomInternalHooksServiceSender', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('FederationEE - Application - FederationRoomInternalHooksServiceSender', () => {
	let service: typeof FederationRoomInternalHooksServiceSender;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
		getInternalRoomById: sinon.stub(),
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
	};
	const messageAdapter = {};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		extractHomeserverOrigin: sinon.stub(),
		createUser: sinon.stub(),
		inviteToRoom: sinon.stub(),
		createRoom: sinon.stub(),
		setRoomName: sinon.stub(),
		getRoomName: sinon.stub(),
		setRoomTopic: sinon.stub(),
		getRoomTopic: sinon.stub(),
		convertMatrixUrlToHttp: sinon.stub().returns('toHttpUrl'),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub().resolves(undefined),
	};
	const invitees = [
		{
			inviteeUsernameOnly: 'marcos.defendi',
			normalizedInviteeId: 'marcos.defendi:matrix.com',
			rawInviteeId: '@marcos.defendi:matrix.com',
		},
	];

	beforeEach(() => {
		service = new FederationRoomInternalHooksServiceSender(
			roomAdapter as any,
			userAdapter as any,
			fileAdapter as any,
			settingsAdapter as any,
			messageAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		roomAdapter.getInternalRoomById.reset();
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
		bridge.setRoomTopic.reset();
		bridge.setRoomName.reset();
		bridge.getRoomName.reset();
		bridge.getRoomTopic.reset();
		bridge.getUserProfileInformation.reset();
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
			await service.onRoomCreated({ invitees } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee user internally if it does not exists (using the username only if it is from the proxy home server)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');

			await service.onRoomCreated({ invitees } as any);

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

			await service.onRoomCreated({ invitees } as any);

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

			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.createUser.calledWith(invitees[0].inviteeUsernameOnly, user.getName(), 'localDomain')).to.be.true;
		});

		it('should NOT create the invitee user on the proxy home server if the invitee is from the same home server but it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves({});

			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should NOT create the invitee user on the proxy home server if its not from the same home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

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

			await service.onRoomCreated({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.inviteToRoom.calledWith(room.getExternalId(), user.getExternalId(), invitee.getExternalId())).to.be.true;
		});
	});

	describe('#beforeAddUserToARoom()', () => {
		const federatedUser = FederatedUserEE.createInstance('externalInviteeId', {
			name: 'normalizedInviteeId',
			username: 'normalizedInviteeId',
			existsOnlyOnProxyServer: false,
		});
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
			await service.onUsersAddedToARoom({ invitees } as any);

			expect(bridge.createUser.called).to.be.false;
			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should throw an error if the inviter user was not found', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);

			await expect(service.onUsersAddedToARoom({ invitees, internalInviterId: 'internalInviterId' } as any)).to.be.rejectedWith(
				'User with internalId internalInviterId not found',
			);
		});

		it('should NOT create the invitee user if the user already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.onUsersAddedToARoom({ invitees } as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should create the invitee user internally if it does not exists (using the username only if it is from the proxy home server)', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');

			await service.onUsersAddedToARoom({ invitees } as any);

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

			await service.onUsersAddedToARoom({ invitees } as any);

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

			await service.onUsersAddedToARoom({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.createUser.calledWith(invitees[0].inviteeUsernameOnly, user.getName(), 'localDomain')).to.be.true;
		});

		it('should NOT create the invitee user on the proxy home server if the invitee is from the same home server but it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('localDomain');
			bridge.getUserProfileInformation.resolves({});

			await service.onUsersAddedToARoom({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should NOT create the invitee user on the proxy home server if its not from the same home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.extractHomeserverOrigin.returns('externalDomain');

			await service.onUsersAddedToARoom({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

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

			await service.onUsersAddedToARoom({ invitees, internalRoomId: 'internalRoomId', ...invitees[0] } as any);

			expect(bridge.inviteToRoom.calledWith(room.getExternalId(), user.getExternalId(), invitee.getExternalId())).to.be.true;
		});
	});

	describe('#afterRoomNameChanged()', () => {
		const user = FederatedUserEE.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

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
		const user = FederatedUserEE.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

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
