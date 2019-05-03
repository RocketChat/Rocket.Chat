import { Template } from 'meteor/templating';

import { t, roomTypes } from '../../utils/client';

import { Rooms } from '../../models/client';
import { callbacks } from '../../callbacks/client';

Template.chatRoomItem.helpers({
	roomData() {
		const { context, context: { settings } = {}, subscription } = this;
		const unread = subscription.unread > 0 ? subscription.unread : false;
		// if (subscription.unread > 0 && (!hasFocus || openedRoom !== subscription.rid)) {
		// 	unread = subscription.unread;
		// }

		const roomType = roomTypes.getConfig(subscription.t);

		const archivedClass = subscription.archived ? 'archived' : false;

		const icon = subscription.t !== 'd' && roomTypes.getIcon(subscription);

		const roomData = {
			...subscription,
			icon,
			avatar: roomType.getAvatarPath(subscription),
			username : subscription.name,
			route: roomTypes.getRouteLink(subscription.t, subscription),
			name: roomType.roomName(subscription),
			unread,
			active: false,
			archivedClass,
			status: subscription.t === 'd' || subscription.t === 'l',
			context,
		};
		roomData.username = roomData.username || roomData.name;

		if (!subscription.lastMessage && settings.Store_Last_Message) {
			const room = Rooms.findOne(subscription.rid || subscription._id, { fields: { lastMessage: 1 } });
			roomData.lastMessage = (room && room.lastMessage) || { msg: t('No_messages_yet') };
		}
		return roomData;
	},
});

callbacks.add('enter-room', (sub) => {
	const items = $('.rooms-list .sidebar-item');
	items.filter('.sidebar-item--active').removeClass('sidebar-item--active');
	if (sub) {
		items.filter(`[data-id=${ sub._id }]`).addClass('sidebar-item--active');
	}
	return sub;
});
