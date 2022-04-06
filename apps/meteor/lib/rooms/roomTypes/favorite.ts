import type { IRoomTypeConfig } from '@rocket.chat/core-typings';
import type { RoomCoordinator } from '../coordinator';

export function getFavoriteRoomType(_coordinator: RoomCoordinator): IRoomTypeConfig {
	return {
		identifier: 'f',
		order: 20,
		header: 'favorite',
		icon: 'star',
		label: 'Favorites',
	};
}
