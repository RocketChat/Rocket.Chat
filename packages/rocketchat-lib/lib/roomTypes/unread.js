import { RoomTypeConfig } from '../RoomTypeConfig';

export class UnreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'unread',
			order: 10,
			label: 'Unread'
		});

		this.unread = true;
	}

	condition() {
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return preferences.roomsListExhibitionMode === 'unread';
	}
}
