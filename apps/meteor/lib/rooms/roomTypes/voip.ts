import { IRoomTypeConfig } from '../../../definition/IRoomTypeConfig';
import type { RoomCoordinator } from '../coordinator';

export function getVoipRoomType(coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'v',
		order: 6,
		icon: 'phone',
		label: 'Voip',
		route: {
			name: 'voip',
			path: '/voip/:id/:tab?/:context?',
			action: ({ id } = {}): void => {
				return coordinator.openRoom('v', id);
			},
			link({ rid }): Record<string, string> {
				return { id: rid || '' };
			},
		},

		notSubscribedTpl: 'livechatNotSubscribed',
		readOnlyTpl: 'ComposerNotAvailablePhoneCalls',
	};
}
