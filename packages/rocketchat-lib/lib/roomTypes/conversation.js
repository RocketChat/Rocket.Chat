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
		return RocketChat.getUserPreference(user, 'roomsListExhibitionMode') === 'activity';
	}
}
