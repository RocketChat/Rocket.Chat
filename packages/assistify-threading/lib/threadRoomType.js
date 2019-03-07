
import { RoomTypeConfig, roomTypes } from 'meteor/rocketchat:utils';
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
}

roomTypes.add(new ThreadRoomType());
