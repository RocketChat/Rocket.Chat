import type { IRoomTypeConfig } from '@rocket.chat/core-typings';

import type { RoomCoordinator } from '../coordinator';

export function getDiscussionRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 't',
		order: 25,
		label: 'Discussion',
	};
}
