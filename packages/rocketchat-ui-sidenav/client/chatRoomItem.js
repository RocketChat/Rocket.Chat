import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { t } from 'meteor/rocketchat:utils';
import { settings } from 'meteor/rocketchat:settings';
import { roomTypes } from 'meteor/rocketchat:utils';
import { Rooms } from 'meteor/rocketchat:models';
import { callbacks } from 'meteor/rocketchat:callbacks';

Template.chatRoomItem.helpers({
	roomData() {
		let { name } = this;
		if (this.fname) {
			const realNameForDirectMessages = this.t === 'd' && settings.get('UI_Use_Real_Name');
			const realNameForChannel = this.t !== 'd' && settings.get('UI_Allow_room_names_with_special_chars');
			if (realNameForDirectMessages || realNameForChannel) {
				name = this.fname;
			}
		}

		const openedRoom = Tracker.nonreactive(() => Session.get('openedRoom'));
		const unread = this.unread > 0 ? this.unread : false;
		// if (this.unread > 0 && (!hasFocus || openedRoom !== this.rid)) {
		// 	unread = this.unread;
		// }

		const active = [this.rid, this._id].includes((id) => id === openedRoom);

		const archivedClass = this.archived ? 'archived' : false;

		this.alert = !this.hideUnreadStatus && this.alert; // && (!hasFocus || FlowRouter.getParam('_id') !== this.rid);

		const icon = roomTypes.getIcon(this.t);
		const avatar = !icon;

		const roomData = {
			...this,
			icon,
			avatar,
			username : this.name,
			route: roomTypes.getRouteLink(this.t, this),
			name: name || roomTypes.getRoomName(this.t, this),
			unread,
			active,
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
