import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface RouterPaths {
		live: {
			pathname: `/live/${string}${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/live/:id/:tab?/:context?';
		};
	}
}

export function getLivechatRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'l',
		route: {
			name: 'live',
			path: '/live/:id/:tab?/:context?',
			link({ rid, tab }): Record<string, string> {
				return { id: rid || '', tab: tab ?? 'room-info' };
			},
		},
	};
}
