import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getVoipRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'v',
		route: {
			name: 'voip',
			path: '/voip/:id/:tab?/:context?',
			link({ rid }): Record<string, string> {
				return { id: rid || '', tab: 'voip-room-info' };
			},
		},
	};
}
