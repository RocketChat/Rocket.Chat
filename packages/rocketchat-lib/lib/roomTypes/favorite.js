import { Meteor } from 'meteor/meteor';
import { settings } from 'meteor/rocketchat:settings';
import { getUserPreference } from 'meteor/rocketchat:utils';
import { RoomTypeConfig } from '../RoomTypeConfig';

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
