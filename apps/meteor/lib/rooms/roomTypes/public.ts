import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

declare module '@rocket.chat/ui-contexts' {
	export interface IRouterPaths {
		channel: {
			pathname: `/channel/${string}${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/channel/:name/:tab?/:context?';
		};
	}
}

export function getPublicRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'c',
		route: {
			name: 'channel',
			path: '/channel/:name/:tab?/:context?',
		},
	};
}
