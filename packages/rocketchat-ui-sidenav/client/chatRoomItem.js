/* globals KonchatNotification */

Template.chatRoomItem.helpers({
	roomData() {
		let name = this.name;
		const realNameForDirectMessages = RocketChat.settings.get('UI_Use_Real_Name') && this.t === 'd';
		const realNameForChannel = RocketChat.settings.get('UI_Allow_room_names_with_special_chars') && this.t !== 'd';
		if ((realNameForDirectMessages || realNameForChannel) && this.fname) {
			name = this.fname;
		}

		let unread = false;
		if (((FlowRouter.getParam('_id') !== this.rid) || !document.hasFocus()) && (this.unread > 0)) {
			unread = this.unread;
		}

		let active = false;
		if (Session.get('openedRoom') && Session.get('openedRoom') === this.rid || Session.get('openedRoom') === this._id) {
			active = true;
		}

		const archivedClass = this.archived ? 'archived' : false;

		let alertClass = false;
		if (!this.hideUnreadStatus && (FlowRouter.getParam('_id') !== this.rid || !document.hasFocus()) && this.alert) {
			alertClass = 'sidebar-content-unread';
		}

		let statusClass = false;

		if (this.t === 'd') {
			switch (RocketChat.roomTypes.getUserStatus(this.t, this.rid)) {
				case 'online':
					statusClass = 'general-success-background';
					break;
				case 'away':
					statusClass = 'general-pending-background';
					break;
				case 'busy':
					statusClass = 'general-error-background';
					break;
				case 'offline':
					statusClass = 'general-inactive-background';
					break;
				default:
					statusClass = 'general-inactive-background';
			}
		}

		// Sound notification
		if (!(FlowRouter.getParam('name') === this.name) && !this.ls && this.alert === true) {
			KonchatNotification.newRoom(this.rid);
		}

		const icon = RocketChat.roomTypes.getIcon(this.t);
		const avatar = !icon;

		return {
			...this,
			icon,
			avatar,
			route: RocketChat.roomTypes.getRouteLink(this.t, this),
			name,
			unread,
			active,
			archivedClass,
			alertClass,
			statusClass
		};
	}
});

Template.chatRoomItem.onRendered = function() {
	if (!(FlowRouter.getParam('name') && (FlowRouter.getParam('name') === this.name)) && !this.ls && (this.alert === true)) {
		return KonchatNotification.newRoom(this.rid);
	}
};
