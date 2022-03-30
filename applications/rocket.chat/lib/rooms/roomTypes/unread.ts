import type { IRoomTypeConfig } from '@rocket.chat/core-typings';

import type { RoomCoordinator } from '../coordinator';

export function getUnreadRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'unread',
		order: 10,
		label: 'Unread',
	};
}
