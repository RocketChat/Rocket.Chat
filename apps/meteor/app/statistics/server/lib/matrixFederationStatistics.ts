import type { IFederationStatistics } from '@rocket.chat/core-services';
import { MatrixBridgedRoom, Rooms, Users, Settings } from '@rocket.chat/models';

class FederationStatisticsAdapter {
	async getBiggestRoomAvailable(): Promise<{
		_id: string;
		name: string;
		usersCount: number;
	} | null> {
		const room = await Rooms.findBiggestFederatedRoomInNumberOfUsers({ projection: { usersCount: 1, fname: 1, name: 1 } });
		if (!room) {
			return null;
		}
		return {
			_id: room._id,
			name: room.fname || room.name || '',
			usersCount: room.usersCount,
		};
	}

	async getSmallestRoomAvailable(): Promise<{
		_id: string;
		name: string;
		usersCount: number;
	} | null> {
		const room = await Rooms.findSmallestFederatedRoomInNumberOfUsers({ projection: { usersCount: 1, fname: 1, name: 1 } });
		if (!room) {
			return null;
		}
		return {
			_id: room._id,
			name: room.fname || room.name || '',
			usersCount: room.usersCount,
		};
	}

	async getAmountOfExternalUsers(): Promise<number> {
		return Users.countFederatedExternalUsers();
	}

	async getAmountOfExternalRooms(): Promise<number> {
		return Rooms.countFederatedRooms();
	}

	async getAmountOfConnectedExternalServers(): Promise<{ quantity: number; servers: string[] }> {
		const homeServerDomain = await Settings.findOneById('Federation_Matrix_homeserver_domain');
		if (!homeServerDomain) {
			return {
				quantity: 0,
				servers: [],
			};
		}
		const externalServers = await MatrixBridgedRoom.getExternalServerConnectedExcluding(String(homeServerDomain.value));

		return {
			quantity: externalServers.length,
			servers: externalServers,
		};
	}
}

export const getMatrixFederationStatistics = async (): Promise<IFederationStatistics> => {
	const statisticsService = new FederationStatisticsAdapter();

	return {
		enabled: (await Settings.findOneById('Federation_Matrix_enabled'))?.value === true,
		maximumSizeOfPublicRoomsUsers: ((await Settings.findOneById('Federation_Matrix_max_size_of_public_rooms_users'))?.value as number) || 0,
		biggestRoom: await statisticsService.getBiggestRoomAvailable(),
		smallestRoom: await statisticsService.getSmallestRoomAvailable(),
		amountOfExternalUsers: await statisticsService.getAmountOfExternalUsers(),
		amountOfFederatedRooms: await statisticsService.getAmountOfExternalRooms(),
		externalConnectedServers: await statisticsService.getAmountOfConnectedExternalServers(),
	};
};
