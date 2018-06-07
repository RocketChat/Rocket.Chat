import { RoomTypeConfig } from '../RoomTypeConfig';

export class FavoriteRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'f',
			order: 20,
			header: 'favorite',
			icon: 'star',
			label: 'Favorites'
		});
	}
	condition() {
		const user = Meteor.user();
		return RocketChat.settings.get('Favorite_Rooms') && RocketChat.getUserPreference(user, 'sidebarShowFavorites');
	}
}
