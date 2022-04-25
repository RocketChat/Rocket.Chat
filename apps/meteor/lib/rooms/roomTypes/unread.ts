import { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getUnreadRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'unread',
		order: 10,
		label: 'Unread',
	};
}
