import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings/client';
import { getUserPreference } from '../../../../app/utils/client';
import { getFavoriteRoomType } from '../../../../lib/rooms/roomTypes/favorite';
import { roomCoordinator } from '../roomCoordinator';

export const FavoriteRoomType = getFavoriteRoomType(roomCoordinator);

roomCoordinator.add(
	{
		...FavoriteRoomType,
		label: 'Favorites',
	},
	{
		condition(): boolean {
			return settings.get('Favorite_Rooms') && getUserPreference(Meteor.userId(), 'sidebarShowFavorites');
		},
		getIcon() {
			return 'star';
		},
	},
);
