import { Meteor } from 'meteor/meteor';
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
		return RocketChat.settings.get('Favorite_Rooms') && RocketChat.getUserPreference(Meteor.userId(), 'sidebarShowFavorites');
	}
}
