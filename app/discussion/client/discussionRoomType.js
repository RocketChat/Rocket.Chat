import { RoomTypeConfig, roomTypes } from '../../utils/client';

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
