import { RoomTypeConfig } from '../RoomTypeConfig';

export class ConversationRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'merged',
			order: 30,
			label: 'Conversations'
		});
	}

	condition() {
		const user = Meteor.user();
		// returns true only if groupByType is not set
		return !RocketChat.getUserPreference(user, 'groupByType');
	}
}
