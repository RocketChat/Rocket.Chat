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
		const preferences = (user && user.settings && user.settings.preferences && user.settings.preferences) || {};
		return ['unread', 'category'].includes(preferences.roomsListExhibitionMode) && preferences.mergeChannels;
	}
}
