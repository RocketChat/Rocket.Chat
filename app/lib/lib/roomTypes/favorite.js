import { Meteor } from 'meteor/meteor';
import { settings } from '/app/settings';
import { getUserPreference, RoomTypeConfig } from '/app/utils';

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
