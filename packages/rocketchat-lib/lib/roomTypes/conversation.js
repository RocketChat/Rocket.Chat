import { Meteor } from 'meteor/meteor';
import { RoomTypeConfig } from '../RoomTypeConfig';

export class ConversationRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'merged',
			order: 30,
			label: 'Conversations',
		});
	}

	condition() {
		// returns true only if sidebarGroupByType is not set
		return !RocketChat.getUserPreference(Meteor.userId(), 'sidebarGroupByType');
	}
}
