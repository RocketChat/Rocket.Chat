import { Meteor } from 'meteor/meteor';
import { getUserPreference, RoomTypeConfig } from 'meteor/rocketchat:utils';

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
		return !getUserPreference(Meteor.userId(), 'sidebarGroupByType');
	}
}
