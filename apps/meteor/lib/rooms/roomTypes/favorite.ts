import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getFavoriteRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'f',
	};
}
