import type { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface RouterPaths {
		group: {
			pathname: `/group/${string}${`/${string}` | ''}${`/${string}` | ''}`;
			pattern: '/group/:name/:tab?/:context?';
		};
	}
}

export function getPrivateRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'p',
		route: {
			name: 'group',
			path: '/group/:name/:tab?/:context?',
		},
	};
}
