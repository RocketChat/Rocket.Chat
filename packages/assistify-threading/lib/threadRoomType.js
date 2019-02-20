import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { RoomTypeConfig, roomTypes } from 'meteor/rocketchat:utils';
export class ThreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'thread',
			order: 25,
			label: 'Threads',
		});

		// we need a custom template in order to have a custom query showing the subscriptions to threads
		this.customTemplate = 'ThreadList';
	}

	condition() {
		return RocketChat.getUserPreference(Meteor.userId(), 'sidebarGroupByType');
	}
}

roomTypes.add(new ThreadRoomType());
