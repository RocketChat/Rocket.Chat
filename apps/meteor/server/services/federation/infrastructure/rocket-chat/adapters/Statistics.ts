import type { IMatrixFederationStatistics } from '@rocket.chat/core-typings';
import { MatrixBridgedRoom, Rooms, Users } from '@rocket.chat/models';

import { settings } from '../../../../../../app/settings/server';

class RocketChatStatisticsAdapter {
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
		const externalServers = await MatrixBridgedRoom.getExternalServerConnectedExcluding(
			settings.get('Federation_Matrix_homeserver_domain'),
		);

		return {
			quantity: externalServers.length,
			servers: externalServers,
		};
	}
}

export const getMatrixFederationStatistics = async (): Promise<IMatrixFederationStatistics> => {
	const statisticsService = new RocketChatStatisticsAdapter();

	return {
		enabled: settings.get('Federation_Matrix_enabled'),
		maximumSizeOfPublicRoomsUsers: settings.get('Federation_Matrix_max_size_of_public_rooms_users'),
		biggestRoom: await statisticsService.getBiggestRoomAvailable(),
		smallestRoom: await statisticsService.getSmallestRoomAvailable(),
		amountOfExternalUsers: await statisticsService.getAmountOfExternalUsers(),
		amountOfFederatedRooms: await statisticsService.getAmountOfExternalRooms(),
		externalConnectedServers: await statisticsService.getAmountOfConnectedExternalServers(),
	};
};
