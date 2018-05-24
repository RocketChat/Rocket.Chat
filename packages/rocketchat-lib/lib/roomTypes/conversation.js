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
		return RocketChat.getUserPreference(Meteor.userId(), 'mergeChannels');
	}
}
