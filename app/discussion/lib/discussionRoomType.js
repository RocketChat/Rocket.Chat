import { Meteor } from 'meteor/meteor';

import { RoomTypeConfig, roomTypes, getUserPreference } from '../../utils';

export class DiscussionRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 't',
			order: 25,
			label: 'Discussion',
		});
	}
}

roomTypes.add(new DiscussionRoomType());
