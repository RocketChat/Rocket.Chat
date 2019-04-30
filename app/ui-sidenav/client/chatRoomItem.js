import { Template } from 'meteor/templating';

import { t, roomTypes } from '../../utils/client';
import { settings } from '../../settings/client';

import { Rooms } from '../../models/client';
import { callbacks } from '../../callbacks/client';

Template.chatRoomItem.helpers({
	roomData() {
		const unread = this.unread > 0 ? this.unread : false;
		// if (this.unread > 0 && (!hasFocus || openedRoom !== this.rid)) {
		// 	unread = this.unread;
		// }

		const roomType = roomTypes.getConfig(this.t);

		const archivedClass = this.archived ? 'archived' : false;

		const icon = this.t !== 'd' && roomTypes.getIcon(this);

		const roomData = {
			...this,
			icon,
			avatar: roomType.getAvatarPath(this),
			username: this.name,
			route: roomTypes.getRouteLink(this.t, this),
			name: roomType.roomName(this),
			unread,
			active: false,
			archivedClass,
			status: this.t === 'd' || this.t === 'l',
		};
		roomData.username = roomData.username || roomData.name;

		if (!this.lastMessage && settings.get('Store_Last_Message')) {
			const room = Rooms.findOne(this.rid || this._id, { fields: { lastMessage: 1 } });
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
