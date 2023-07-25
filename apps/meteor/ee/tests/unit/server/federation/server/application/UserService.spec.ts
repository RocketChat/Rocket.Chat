import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { FederationUserServiceEE } = proxyquire
	.noCallThru()
	.load('../../../../../../server/local-services/federation/application/UserService', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('FederationEE - Application - FederationUserServiceEE', () => {
	let service: typeof FederationUserServiceEE;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
		addUserToRoom: sinon.stub(),
		getFederatedRoomByInternalId: sinon.stub(),
		isUserAlreadyJoined: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		getInternalUserById: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
		createFederatedUser: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
		getSearchedServerNamesByUserId: sinon.stub(),
		addServerNameToSearchedServerNamesListByUserId: sinon.stub(),
		removeServerNameFromSearchedServerNamesListByUserId: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
		isFederationEnabled: sinon.stub(),
	};
	const bridge = {
		createUser: sinon.stub(),
		joinRoom: sinon.stub(),
		getRoomData: sinon.stub(),
		getUserProfileInformation: sinon.stub(),
		extractHomeserverOrigin: sinon.stub(),
		searchPublicRooms: sinon.stub(),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationUserServiceEE(settingsAdapter as any, fileAdapter as any, userAdapter as any, bridge as any);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		roomAdapter.addUserToRoom.reset();
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.isUserAlreadyJoined.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		userAdapter.createFederatedUser.reset();
		userAdapter.getInternalUserByUsername.reset();
		userAdapter.getSearchedServerNamesByUserId.reset();
		userAdapter.addServerNameToSearchedServerNamesListByUserId.reset();
		userAdapter.removeServerNameFromSearchedServerNamesListByUserId.reset();
		settingsAdapter.isFederationEnabled.reset();
		bridge.createUser.reset();
		bridge.joinRoom.reset();
		bridge.getUserProfileInformation.reset();
		bridge.getRoomData.reset();
		bridge.searchPublicRooms.reset();
		fileAdapter.getBufferForAvatarFile.reset();
	});

	describe('#getSearchedServerNamesByInternalUserId()', () => {
		it('should throw an error if the federation is disabled', async () => {
			settingsAdapter.isFederationEnabled.returns(false);
			await expect(service.getSearchedServerNamesByInternalUserId({} as any)).to.be.rejectedWith('Federation is disabled');
		});

		it('should return the Matrix default public rooms + the ones already saved by the user', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getSearchedServerNamesByUserId.resolves(['server1.com', 'server2.com']);
			const result = await service.getSearchedServerNamesByInternalUserId({} as any);

			expect(result).to.be.eql([
				{
					name: 'localDomain',
					default: true,
					local: true,
				},
				{
					name: 'matrix.org',
					default: true,
					local: false,
				},
				{
					name: 'gitter.im',
					default: true,
					local: false,
				},
				{
					name: 'libera.chat',
					default: true,
					local: false,
				},
				{
					name: 'server1.com',
					default: false,
					local: false,
				},
				{
					name: 'server2.com',
					default: false,
					local: false,
				},
			]);
		});
	});

	describe('#addSearchedServerNameByInternalUserId()', () => {
		it('should throw an error if the federation is disabled', async () => {
			settingsAdapter.isFederationEnabled.returns(false);
			await expect(service.addSearchedServerNameByInternalUserId('internalUserId', 'serverName')).to.be.rejectedWith(
				'Federation is disabled',
			);
		});

		it('should throw an error when trying to add a default server', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			await expect(service.addSearchedServerNameByInternalUserId('internalUserId', 'matrix.org')).to.be.rejectedWith(
				'already-a-default-server',
			);
		});

		it('should call the bridge to check if the server is valid', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			bridge.searchPublicRooms.resolves();
			await service.addSearchedServerNameByInternalUserId('internalUserId', 'serverName');
			expect(bridge.searchPublicRooms.calledWith({ serverName: 'serverName' })).to.be.true;
		});

		it('should call the function to add the server name', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			bridge.searchPublicRooms.resolves();
			await service.addSearchedServerNameByInternalUserId('internalUserId', 'serverName');
			expect(userAdapter.addServerNameToSearchedServerNamesListByUserId.calledWith('internalUserId', 'serverName')).to.be.true;
		});
	});

	describe('#removeSearchedServerNameByInternalUserId()', () => {
		it('should throw an error if the federation is disabled', async () => {
			settingsAdapter.isFederationEnabled.returns(false);
			await expect(service.removeSearchedServerNameByInternalUserId('internalUserId', 'serverName')).to.be.rejectedWith(
				'Federation is disabled',
			);
		});

		it('should throw an error when trying to remove a default server', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			await expect(service.removeSearchedServerNameByInternalUserId('internalUserId', 'matrix.org')).to.be.rejectedWith(
				'cannot-remove-default-server',
			);
		});

		it('should throw an error when the server does not exists', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getSearchedServerNamesByUserId.resolves([]);
			await expect(service.removeSearchedServerNameByInternalUserId('internalUserId', 'serverName')).to.be.rejectedWith('server-not-found');
		});

		it('should call the function to remove the server name', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getSearchedServerNamesByUserId.resolves(['serverName']);
			await service.removeSearchedServerNameByInternalUserId('internalUserId', 'serverName');
			expect(userAdapter.removeServerNameFromSearchedServerNamesListByUserId.calledWith('internalUserId', 'serverName')).to.be.true;
		});
	});
});
