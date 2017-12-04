import { RoomTypeConfig } from '../RoomTypeConfig';

export class ConversationRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'activity',
			order: 30,
			label: 'Conversations'
		});
	}

	condition() {
		const user = Meteor.user();
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return preferences.roomsListExhibitionMode === 'activity';
	}
}
