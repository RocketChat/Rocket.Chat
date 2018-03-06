Template.chatRoomItem.helpers({
	roomData() {
		let unread = false;
		if (((FlowRouter.getParam('_id') !== this.rid) || !document.hasFocus()) && (this.unread > 0)) {
			unread = this.unread;
		}

		let active = false;
		if ([this.rid, this._id].find(id => id === Session.get('openedRoom'))) {
			active = true;
		}

		const archivedClass = this.archived ? 'archived' : false;

		this.alert = !this.hideUnreadStatus && (FlowRouter.getParam('_id') !== this.rid || !document.hasFocus()) && this.alert;

		const icon = RocketChat.roomTypes.getIcon(this.t);
		const avatar = !icon;

		const roomData = {
			...this,
			icon,
			avatar,
			username : this.name,
			route: RocketChat.roomTypes.getRouteLink(this.t, this),
			name: RocketChat.roomTypes.getRoomName(this.t, this),
			unread,
			active,
			archivedClass,
			statusClass: this.t === 'd' ? Session.get(`user_${ this.name }_status`) || 'offline' : this.t === 'l' ? RocketChat.roomTypes.getUserStatus(this.t, this.rid) || 'offline' : false
		};

		if (RocketChat.settings.get('Store_Last_Message')) {
			if (this.lastMessage) {
				roomData.lastMessage = this.lastMessage;
			} else {
				const room = RocketChat.models.Rooms.findOne(this.rid || this._id, { fields: { lastMessage: 1 } });
				roomData.lastMessage = room && room.lastMessage || { msg: t('No_messages_yet') };
			}
		}

		return roomData;
	}
});
