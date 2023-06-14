import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface RouterPaths {
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
