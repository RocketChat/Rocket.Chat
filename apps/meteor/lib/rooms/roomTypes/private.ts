import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getPrivateRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'p',
		route: {
			name: 'group',
			path: '/group/:name/:tab?/:context?',
		},
	};
}
