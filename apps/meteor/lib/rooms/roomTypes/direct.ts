import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

declare module '@rocket.chat/ui-contexts' {
	export interface IRouterPaths {
		direct: {
			pathname: `/direct/:rid${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/direct/:rid/:tab?/:context?';
		};
	}
}

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
