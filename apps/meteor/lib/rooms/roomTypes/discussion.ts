import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getDiscussionRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 't',
		order: 25,
		label: 'Discussion',
	};
}
