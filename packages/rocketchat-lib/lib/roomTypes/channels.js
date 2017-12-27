import { RoomTypeConfig } from '../RoomTypeConfig';

export class ChannelsRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'channels',
			order: 30,
			label: 'Channels'
		});
	}

	condition() {
		const user = Meteor.user();
		const roomsListExhibitionMode = RocketChat.getUserPreference(user, 'roomsListExhibitionMode');
		const mergeChannels = RocketChat.getUserPreference(user, 'mergeChannels');
		return ['unread', 'category'].includes(roomsListExhibitionMode) && mergeChannels;
	}
}
