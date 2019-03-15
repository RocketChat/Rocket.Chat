import { Meteor } from 'meteor/meteor';
import { RoomTypeConfig, roomTypes, getUserPreference } from '../../utils';

export class ThreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 't',
			order: 25,
			label: 'Threads',
		});

		// we need a custom template in order to have a custom query showing the subscriptions to threads
		this.customTemplate = 'ThreadList';
	}

	condition() {
		return getUserPreference(Meteor.userId(), 'sidebarShowThreads');
	}
}

roomTypes.add(new ThreadRoomType());
