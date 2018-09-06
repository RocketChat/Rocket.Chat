import {RocketChat, RoomTypeConfig} from 'meteor/rocketchat:lib';

export class ThreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'thread',
			order: 25,
			label: 'Threads'
		});
	}

	condition() {
		return RocketChat.getUserPreference(Meteor.userId(), 'sidebarGroupByType');
	}
}

RocketChat.roomTypes.add(new ThreadRoomType());
