import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getDirectMessageRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'd',
		route: {
			name: 'direct',
			path: '/direct/:rid/:tab?/:context?',
			link(sub): Record<string, string> {
				return { rid: sub.rid || sub.name || '' };
			},
		},
	};
}
