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
const { FederationDMRoomInternalHooksServiceSender } = proxyquire
	.noCallThru()
	.load('../../../../../../app/federation-v2/server/application/sender/room/DMRoomInternalHooksServiceSender', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('FederationEE - Application - FederationDMRoomInternalHooksServiceSender', () => {
	let service: typeof FederationDMRoomInternalHooksServiceSender;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		updateFederatedRoomByInternalRoomId: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
		createLocalUser: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const bridge = {
		getUserProfileInformation: sinon.stub().resolves({}),
		extractHomeserverOrigin: sinon.stub(),
		createUser: sinon.stub(),
		createDirectMessageRoom: sinon.stub(),
	};
	const invitees = [
		{
			inviteeUsernameOnly: 'marcos.defendi',
			normalizedInviteeId: 'marcos.defendi:matrix.com',
			rawInviteeId: '@marcos.defendi:matrix.com',
		},
	];

	beforeEach(() => {
		service = new FederationDMRoomInternalHooksServiceSender(
			roomAdapter as any,
			userAdapter as any,
			{} as any,
			settingsAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.updateFederatedRoomByInternalRoomId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.createLocalUser.reset();
		userAdapter.getInternalUserByUsername.reset();
		bridge.extractHomeserverOrigin.reset();
		bridge.createUser.reset();
		bridge.createDirectMessageRoom.reset();
	});

	describe('#onDirectMessageRoomCreation()', () => {
		const user = FederatedUserEE.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		const room = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT create the inviter user both externally and internally if it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should create the inviter user both externally and internally if it does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalId.onCall(1).resolves(user);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			bridge.createUser.resolves('externalInviterId');
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			const inviter = FederatedUserEE.createInstance('externalInviterId', {
				name: 'name',
				username: 'username',
				existsOnlyOnProxyServer: true,
			});
			expect(bridge.createUser.calledWith('username', 'name', 'localDomain')).to.be.true;
			expect(userAdapter.createFederatedUser.calledWith(inviter)).to.be.true;
		});

		it('should throw an error if the inviter does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username', name: 'name' } as any);

			await expect(
				service.onDirectMessageRoomCreation({ invitees, internalInviterId: 'internalInviterId', internalRoomId: 'internalRoomId' } as any),
			).to.be.rejectedWith('User with internalId internalInviterId not found');
		});

		it('should create the external room with all (the external) the invitees when the inviter is from the same homeserver, when at least one invitee is external', async () => {
			bridge.extractHomeserverOrigin.onCall(0).returns('matrix.com');
			bridge.extractHomeserverOrigin.returns('localDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			bridge.createDirectMessageRoom.resolves('externalRoomId');

			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(
				bridge.createDirectMessageRoom.calledWith(
					user.getExternalId(),
					invitees.map((invitee) => invitee.rawInviteeId),
				),
			).to.be.true;
			expect(roomAdapter.updateFederatedRoomByInternalRoomId.calledWith('internalRoomId', 'externalRoomId')).to.be.true;
		});

		it('should NOT create the external room with any invitee when all of them are local only and the inviter is from the same homeserver', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			bridge.createDirectMessageRoom.resolves('externalRoomId');

			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(bridge.createDirectMessageRoom.called).to.be.false;
			expect(roomAdapter.updateFederatedRoomByInternalRoomId.called).to.be.false;
		});

		it('should NOT create the external room with all the invitees when the inviter is NOT from the same homeserver', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(bridge.createDirectMessageRoom.called).to.be.false;
			expect(roomAdapter.updateFederatedRoomByInternalRoomId.called).to.be.false;
		});

		it('should create the invitee user if it does not exists and it is from the same home server, but he is not the only one, there is also an external invitee', async () => {
			bridge.extractHomeserverOrigin.onCall(0).returns('matrix.com');
			bridge.extractHomeserverOrigin.returns('localDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].inviteeUsernameOnly,
				username: invitees[0].inviteeUsernameOnly,
				existsOnlyOnProxyServer: true,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should create the invitee user if it does not exists and it is NOT from the same home server', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.onCall(0).resolves(undefined);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].normalizedInviteeId,
				username: invitees[0].normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			expect(userAdapter.createFederatedUser.calledWith(invitee)).to.be.true;
		});

		it('should NOT create the invitee user if it already exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(userAdapter.createFederatedUser.called).to.be.false;
		});

		it('should NOT create the user on the proxy homeserver if it is NOT from the same homeserver, which means is a external user', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should throw an error if the invitee is from the same home server but the federated user does not exists and also there is at least one external user', async () => {
			bridge.extractHomeserverOrigin.onCall(0).returns('matrix.com');
			bridge.extractHomeserverOrigin.returns('localDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.resolves(undefined);

			await expect(
				service.onDirectMessageRoomCreation({ invitees, internalInviterId: 'internalInviterId', internalRoomId: 'internalRoomId' } as any),
			).to.be.rejectedWith(`User with internalUsername ${invitees[0].inviteeUsernameOnly} not found`);
		});

		it('should NOT create the user on the proxy homeserver if it is from the same home server AND already exists on it', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			bridge.getUserProfileInformation.resolves({});
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			expect(bridge.createUser.called).to.be.false;
		});

		it('should create the user on the proxy home server if it is from the same home server AND does not exists there yet', async () => {
			bridge.extractHomeserverOrigin.returns('externalDomain');
			userAdapter.getFederatedUserByInternalId.resolves(user);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalUsername.resolves(user);
			bridge.getUserProfileInformation.resolves(undefined);
			await service.onDirectMessageRoomCreation({
				invitees,
				internalInviterId: 'internalInviterId',
				internalRoomId: 'internalRoomId',
			} as any);

			const invitee = FederatedUserEE.createInstance(invitees[0].rawInviteeId, {
				name: invitees[0].normalizedInviteeId,
				username: invitees[0].normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			expect(bridge.createUser.calledWith(invitees[0].inviteeUsernameOnly, invitee.getUsername(), 'localDomain')).to.be.false;
		});
	});

	describe('#beforeDirectMessageRoomCreation()', () => {
		it('should create the invitee locally for each external user', async () => {
			bridge.extractHomeserverOrigin.onCall(0).returns('externalDomain');
			bridge.extractHomeserverOrigin.onCall(1).returns('localDomain');
			await service.beforeDirectMessageRoomCreation({
				invitees: [
					...invitees,
					{
						inviteeUsernameOnly: 'marcos.defendiNotToBeInvited',
						normalizedInviteeId: 'marcos.defendi:matrix.comNotToBeInvited',
						rawInviteeId: '@marcos.defendi:matrix.comNotToBeInvited',
					},
				],
			} as any);

			const invitee = FederatedUserEE.createLocalInstanceOnly({
				name: invitees[0].normalizedInviteeId,
				username: invitees[0].normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			expect(userAdapter.createLocalUser.calledOnceWithExactly(invitee)).to.be.true;
		});
	});
});
