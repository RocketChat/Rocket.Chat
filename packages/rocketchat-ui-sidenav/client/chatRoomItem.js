/* globals KonchatNotification */

Template.chatRoomItem.helpers({
	data() {
		let name = this.name;
		if (RocketChat.settings.get('UI_Use_Real_Name') && this.fname) {
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
		return {
			...this,
			name,
			unread,
			active,
			archivedClass,
			alertClass,
			statusClass
		};
	},

	canLeave() {
		const roomData = Session.get(`roomData${ this.rid }`);

		if (!roomData) { return false; }

		if (((roomData.cl != null) && !roomData.cl) || (roomData.t === 'd')) {
			return false;
		} else {
			return true;
		}
	}
});

Template.chatRoomItem.onRendered = function() {
	if (!(FlowRouter.getParam('_id') && (FlowRouter.getParam('_id') === this.data.rid)) && !this.data.ls && (this.data.alert === true)) {
		return KonchatNotification.newRoom(this.data.rid);
	}
};
