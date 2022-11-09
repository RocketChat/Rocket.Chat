import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getPrivateRoomType(coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'p',
		order: 40,
		icon: 'hashtag-lock',
		label: 'Private_Groups',
		route: {
			name: 'group',
			path: '/group/:name/:tab?/:context?',
			action: ({ name } = {}): void => {
				return coordinator.openRoom('p', name);
			},
		},
	};
}
