import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getPublicRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'c',
		route: {
			name: 'channel',
			path: '/channel/:name/:tab?/:context?',
		},
	};
}
