import { Meteor } from 'meteor/meteor';
import { settings } from '../../../settings';
import { getUserPreference, RoomTypeConfig } from '../../../utils';

export class FavoriteRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'f',
			order: 20,
			header: 'favorite',
			icon: 'star',
			label: 'Favorites',
		});
	}
	condition() {
		return settings.get('Favorite_Rooms') && getUserPreference(Meteor.userId(), 'sidebarShowFavorites');
	}
}
