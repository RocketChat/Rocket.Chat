import {RocketChat, RoomTypeConfig} from 'meteor/rocketchat:lib';

export class ThreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'thread',
			order: 5,
			label: 'Threads'
		});

		this.customTemplate = 'ThreadList';
	}

	condition() {
		return RocketChat.getUserPreference(Meteor.userId(), 'sidebarShowThreads');
	}
}

RocketChat.roomTypes.add(new ThreadRoomType());
