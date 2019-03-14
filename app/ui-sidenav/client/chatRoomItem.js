import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { t } from '/app/utils';
import { settings } from '/app/settings';
import { roomTypes } from '/app/utils';
import { Rooms } from '/app/models';
import { callbacks } from '/app/callbacks';

Template.chatRoomItem.helpers({
	roomData() {
		const openedRoom = Tracker.nonreactive(() => Session.get('openedRoom'));
		const unread = this.unread > 0 ? this.unread : false;
		// if (this.unread > 0 && (!hasFocus || openedRoom !== this.rid)) {
		// 	unread = this.unread;
		// }

		const active = [this.rid, this._id].includes((id) => id === openedRoom);

		const archivedClass = this.archived ? 'archived' : false;

		this.alert = !this.hideUnreadStatus && this.alert; // && (!hasFocus || FlowRouter.getParam('_id') !== this.rid);

		const icon = this.t !== 'd' && roomTypes.getIcon(this);
		const avatar = !icon;

		const name = roomTypes.getRoomName(this.t, this);

		const roomData = {
			...this,
			icon,
			avatar,
			username : this.name,
			route: roomTypes.getRouteLink(this.t, this),
			name,
			unread,
			active,
			archivedClass,
			status: this.t === 'd' || this.t === 'l',
		};
		roomData.username = roomData.username || roomData.name;

		// hide icon for threads
		if (this.prid) {
			roomData.darken = true;
		}

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
