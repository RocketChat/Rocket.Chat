import { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getLivechatRoomType(coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'l',
		order: 5,
		icon: 'omnichannel',
		label: 'Omnichannel',
		route: {
			name: 'live',
			path: '/live/:id/:tab?/:context?',
			action: ({ id } = {}): void => {
				return coordinator.openRoom('l', id);
			},
			link({ rid }): Record<string, string> {
				return { id: rid || '' };
			},
		},

		notSubscribedTpl: 'livechatNotSubscribed',
		readOnlyTpl: 'livechatReadOnly',
	};
}
