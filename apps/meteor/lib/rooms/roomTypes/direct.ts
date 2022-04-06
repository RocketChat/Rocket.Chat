import { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getDirectMessageRoomType(coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'd',
		order: 50,
		icon: 'at',
		label: 'Direct_Messages',
		route: {
			name: 'direct',
			path: '/direct/:rid/:tab?/:context?',
			action: ({ rid } = {}): void => {
				return coordinator.openRoom('d', rid);
			},
			link(sub): Record<string, string> {
				return { rid: sub.rid || sub.name || '' };
			},
		},
	};
}
