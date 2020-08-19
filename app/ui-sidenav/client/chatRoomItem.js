import { Template } from 'meteor/templating';

import { t, roomTypes } from '../../utils/client';
import { Rooms } from '../../models/client';
import { callbacks } from '../../callbacks/client';

Template.chatRoomItem.helpers({
	roomData() {
		const { user, settings } = Template.currentData();
		const unread = this.room.unread > 0 ? this.room.unread : false;
		// if (this.room.unread > 0 && (!hasFocus || openedRoom !== this.room.rid)) {
		// 	unread = this.room.unread;
		// }

		const roomType = roomTypes.getConfig(this.room.t);

		const archivedClass = this.room.archived ? 'archived' : false;

		const room = Rooms.findOne(this.room.rid);

		const icon = roomTypes.getIcon(this.room.t === 'd' ? room : this.room);

		const roomData = {
			...this.room,
			icon: icon !== 'at' && icon,
			avatar: roomTypes.getConfig(this.room.t).getAvatarPath(room || this.room),
			username: this.room.name,
			route: roomTypes.getRouteLink(this.room.t, this.room),
			name: roomType.roomName(this.room),
			unread,
			active: false,
			archivedClass,
			status: this.room.t === 'd' || this.room.t === 'l',
			isGroupChat: roomType.isGroupChat(room),
		};
		roomData.username = roomData.username || roomData.name;

		if (!this.room.lastMessage && settings.storeLastMessage) {
			const room = Rooms.findOne(this.room.rid || this.room._id, { fields: { lastMessage: 1 } });
			roomData.lastMessage = (room && room.lastMessage) || { msg: t('No_messages_yet') };
		}
		return {
			room: roomData,
			user,
			settings,
		};
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
