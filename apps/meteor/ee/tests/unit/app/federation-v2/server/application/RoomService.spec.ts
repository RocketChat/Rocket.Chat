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
const { FederationRoomApplicationServiceEE } = proxyquire
	.noCallThru()
	.load('../../../../../../app/federation-v2/server/application/RoomService', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

describe('FederationEE - Application - FederationRoomApplicationServiceEE', () => {
	let service: typeof FederationRoomApplicationServiceEE;
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
		searchPublicRooms: sinon.stub(),
		createUser: sinon.stub(),
		joinRoom: sinon.stub(),
		getRoomData: sinon.stub(),
		getUserProfileInformation: sinon.stub(),
		extractHomeserverOrigin: sinon.stub(),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub(),
	};
	const notificationAdapter = {
		subscribeToUserTypingEventsOnFederatedRoomId: sinon.stub(),
		broadcastUserTypingOnRoom: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationRoomApplicationServiceEE(
			settingsAdapter as any,
			fileAdapter as any,
			userAdapter as any,
			roomAdapter as any,
			notificationAdapter as any,
			bridge as any,
		);
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
		bridge.searchPublicRooms.reset();
		bridge.createUser.reset();
		bridge.joinRoom.reset();
		bridge.getUserProfileInformation.reset();
		bridge.getRoomData.reset();
		fileAdapter.getBufferForAvatarFile.reset();
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
			bridge.searchPublicRooms.returns({
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
					},
					{
						id: 'externalRoomId2',
						name: 'externalRoomName2',
						joinedMembers: 1,
						topic: 'externalRoomTopic2',
						canonicalAlias: 'externalRoomAlias2',
						canJoin: true,
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
			bridge.searchPublicRooms.returns({
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
					},
				],
				count: 2,
				total: 10000,
				nextPageToken: 'next_batch',
				prevPageToken: 'prev_batch',
			});
		});
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

			await service.joinExternalPublicRoom({} as any);

			expect(spy.called).to.be.false;
		});

		it('should create an external user if it does not exists', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByInternalId.onFirstCall().resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');

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

		it('should join the user to the remote room', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByInternalId.resolves(user);

			await service.joinExternalPublicRoom({
				externalRoomId: 'externalRoomId',
				internalUserId: 'internalUserId',
				externalRoomHomeServerName: 'externalRoomHomeServerName',
			} as any);

			expect(bridge.joinRoom.calledWith('externalRoomId', user.getExternalId(), ['externalRoomHomeServerName'])).to.be.true;
		});

		it('should create a federated user for the room creator if it does not exists (external one)', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getRoomData.resolves({ creator: { id: '@externalId', username: 'username' }, name: 'roomName' });
			bridge.extractHomeserverOrigin.returns('externalDomain');
			const spy = sinon.spy(service, 'createFederatedUserInternallyOnly');

			await service.joinExternalPublicRoom({ internalUserId: 'internalUserId' } as any);

			expect(spy.calledWith('@externalId', 'externalId', false)).to.be.true;
		});

		it('should create a federated user for the room creator if it does not exists (local one)', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getRoomData.resolves({ creator: { id: '@externalId', username: 'username' }, name: 'roomName' });
			bridge.extractHomeserverOrigin.returns('localDomain');
			const spy = sinon.spy(service, 'createFederatedUserInternallyOnly');

			await service.joinExternalPublicRoom({ internalUserId: 'internalUserId' } as any);

			expect(spy.calledWith('@externalId', 'username', true)).to.be.true;
		});

		it('should NOT create an external user for the room creator if it already exists', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getRoomData.resolves({ creator: { id: 'id', username: 'username' }, name: 'roomName' });
			const spy = sinon.spy(service, 'createFederatedUserInternallyOnly');

			await service.joinExternalPublicRoom({
				internalUserId: 'internalUserId',
				normalizedRoomId: 'normalizedRoomId',
				externalRoomId: 'externalRoomId',
			} as any);

			expect(spy.called).to.be.false;
		});

		it('should create a federated room if it does not exists yet', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getRoomData.resolves({ creator: { id: 'id', username: 'username' }, name: 'roomName' });
			roomAdapter.getFederatedRoomByExternalId.onFirstCall().resolves(undefined);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);

			await service.joinExternalPublicRoom({
				internalUserId: 'internalUserId',
				normalizedRoomId: 'normalizedRoomId',
				externalRoomId: 'externalRoomId',
			} as any);

			const roomToBeCreated = FederatedRoomEE.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'roomName');

			expect(roomAdapter.createFederatedRoom.calledWith(roomToBeCreated)).to.be.true;
		});

		it('should NOT create a federated room if it already exists', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getRoomData.resolves({ creator: { id: 'id', username: 'username' }, name: 'roomName' });
			roomAdapter.getFederatedRoomByExternalId.resolves(room);

			await service.joinExternalPublicRoom({
				internalUserId: 'internalUserId',
				normalizedRoomId: 'normalizedRoomId',
			} as any);

			expect(roomAdapter.createFederatedRoom.called).to.be.false;
		});

		it('should subscribe to typing events and finally adds the user to the room', async () => {
			settingsAdapter.isFederationEnabled.returns(true);
			userAdapter.getFederatedUserByExternalId.onFirstCall().resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			userAdapter.getFederatedUserByInternalId.resolves(user);
			userAdapter.getFederatedUserByExternalId.resolves(user);
			bridge.getRoomData.resolves({ creator: { id: 'id', username: 'username' }, name: 'roomName' });
			roomAdapter.getFederatedRoomByExternalId.resolves(room);

			await service.joinExternalPublicRoom({
				internalUserId: 'internalUserId',
				normalizedRoomId: 'normalizedRoomId',
			} as any);

			expect(notificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId.calledWith(room.getInternalId())).to.be.true;
			expect(roomAdapter.addUserToRoom.calledWith(room, user)).to.be.true;
		});
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
