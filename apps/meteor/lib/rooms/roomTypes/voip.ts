import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

declare module '@rocket.chat/ui-contexts' {
	export interface IRouterPaths {
		voip: {
			pathname: `/voip/${string}${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/voip/:id/:tab?/:context?';
		};
	}
}

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
