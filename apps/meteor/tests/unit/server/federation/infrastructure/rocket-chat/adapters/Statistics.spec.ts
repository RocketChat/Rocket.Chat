import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const get = sinon.stub();
const findBiggestFederatedRoomInNumberOfUsers = sinon.stub();
const findSmallestFederatedRoomInNumberOfUsers = sinon.stub();
const countFederatedExternalUsers = sinon.stub();
const countFederatedRooms = sinon.stub();
const getExternalServerConnectedExcluding = sinon.stub();

const { getMatrixFederationStatistics } = proxyquire
	.noCallThru()
	.load('../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Statistics', {
		'../../../../../../app/settings/server': {
			settings: {
				get,
			},
		},
		'@rocket.chat/models': {
			MatrixBridgedRoom: {
				getExternalServerConnectedExcluding,
			},
			Rooms: {
				findBiggestFederatedRoomInNumberOfUsers,
				findSmallestFederatedRoomInNumberOfUsers,
				countFederatedRooms,
			},
			Users: {
				countFederatedExternalUsers,
			},
		},
	});

describe('Federation - Infrastructure - RocketChat - Statistics', () => {
	afterEach(() => {
		findBiggestFederatedRoomInNumberOfUsers.reset();
		findSmallestFederatedRoomInNumberOfUsers.reset();
		countFederatedExternalUsers.reset();
		countFederatedRooms.reset();
		getExternalServerConnectedExcluding.reset();
	});

	describe('#getMatrixFederationStatistics()', () => {
		it('should return null as the biggestRoom when there is no biggest room available', async () => {
			findBiggestFederatedRoomInNumberOfUsers.resolves(null);
			getExternalServerConnectedExcluding.resolves([]);
			expect((await getMatrixFederationStatistics()).biggestRoom).to.be.null;
		});

		it('should return null as the smallestRoom when there is no smallest room available', async () => {
			findSmallestFederatedRoomInNumberOfUsers.resolves(null);
			getExternalServerConnectedExcluding.resolves([]);
			expect((await getMatrixFederationStatistics()).smallestRoom).to.be.null;
		});

		it('should return all matrix federation statistics metrics related', async () => {
			const props: any = {
				Federation_Matrix_enabled: true,
				Federation_Matrix_max_size_of_public_rooms_users: '100',
			};
			get.callsFake((key) => props[key]);

			const biggestRoom = { _id: '_id', name: 'name', usersCount: 99 };
			const smallestRoom = { _id: '_id', name: 'name', usersCount: 2 };
			findBiggestFederatedRoomInNumberOfUsers.resolves(biggestRoom);
			findSmallestFederatedRoomInNumberOfUsers.resolves(smallestRoom);
			countFederatedExternalUsers.resolves(10);
			countFederatedRooms.resolves(20);
			getExternalServerConnectedExcluding.resolves(['server1', 'server2']);

			expect(await getMatrixFederationStatistics()).to.be.eql({
				enabled: props.Federation_Matrix_enabled,
				maximumSizeOfPublicRoomsUsers: props.Federation_Matrix_max_size_of_public_rooms_users,
				biggestRoom,
				smallestRoom,
				amountOfExternalUsers: 10,
				amountOfFederatedRooms: 20,
				externalConnectedServers: { quantity: 2, servers: ['server1', 'server2'] },
			});
		});
	});
});
