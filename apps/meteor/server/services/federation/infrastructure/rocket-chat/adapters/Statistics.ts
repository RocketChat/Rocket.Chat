import type { IMatrixFederationStatistics } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

import { db } from '../../../../../database/utils';
import { settings } from '../../../../../settings';

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
		const localDomain = settings.get<string>('Federation_Service_Domain');
		// raw to avoid creating a model just for this query
		const servers = (await db.collection('rocketchat_federation_servers').distinct('name')).filter(
			(name): name is string => typeof name === 'string' && name !== localDomain,
		);

		return {
			quantity: servers.length,
			servers,
		};
	}

	async getAmountOfFederationEvents(): Promise<number> {
		return db.collection('rocketchat_federation_events').estimatedDocumentCount();
	}
}

export const getMatrixFederationStatistics = async (): Promise<IMatrixFederationStatistics> => {
	const statisticsService = new RocketChatStatisticsAdapter();

	return {
		enabled: settings.get('Federation_Service_Enabled'),
		maximumSizeOfPublicRoomsUsers: settings.get('Federation_Service_max_allowed_size_of_public_rooms_to_join'),
		biggestRoom: await statisticsService.getBiggestRoomAvailable(),
		smallestRoom: await statisticsService.getSmallestRoomAvailable(),
		amountOfExternalUsers: await statisticsService.getAmountOfExternalUsers(),
		amountOfFederatedRooms: await statisticsService.getAmountOfExternalRooms(),
		amountOfFederationEvents: await statisticsService.getAmountOfFederationEvents(),
		externalConnectedServers: await statisticsService.getAmountOfConnectedExternalServers(),
	};
};
