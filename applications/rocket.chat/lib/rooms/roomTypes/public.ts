import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getPublicRoomType(coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'c',
		order: 30,
		icon: 'hashtag',
		label: 'Channels',
		route: {
			name: 'channel',
			path: '/channel/:name/:tab?/:context?',
			action: ({ name } = {}): void => {
				return coordinator.openRoom('c', name);
			},
		},
	};
}
