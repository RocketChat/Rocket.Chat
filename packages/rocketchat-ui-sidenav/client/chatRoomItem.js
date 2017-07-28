/* globals KonchatNotification, menu */

Template.chatRoomItem.helpers({

	alert() {
		if (!this.hideUnreadStatus && (FlowRouter.getParam('_id') !== this.rid || !document.hasFocus())) {
			return this.alert;
		}
	},

	unread() {
		if (((FlowRouter.getParam('_id') !== this.rid) || !document.hasFocus()) && (this.unread > 0)) {
			return this.unread;
		}
	},

	unreadClass() {
		if (RocketChat.settings.get('UI_Unread_Counter_Style') === 'Same_Style_For_Mentions') {
			return 'unread unread-mention';
		}

		if (Match.test(this.userMentions, Number) && this.userMentions > 0) {
			return 'unread unread-mention';
		}

		return 'unread';
	},

	userStatus() {
		const userStatus = RocketChat.roomTypes.getUserStatus(this.t, this.rid);
		return `status-${ userStatus || 'offline' }`;
	},

	name() {
		const realNameForDirectMessages = RocketChat.settings.get('UI_Use_Real_Name') && this.t === 'd';
		const realNameForChannel = RocketChat.settings.get('UI_Allow_room_names_with_special_chars') && this.t !== 'd';
		if ((realNameForDirectMessages || realNameForChannel) && this.fname) {
			return this.fname;
		}

		return this.name;
	},

	roomIcon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},

	active() {
		if (Session.get('openedRoom') && Session.get('openedRoom') === this.rid || Session.get('openedRoom') === this._id) {
			return 'active';
		}
	},

	canLeave() {
		const roomData = Session.get(`roomData${ this.rid }`);

		if (!roomData) { return false; }

		if (((roomData.cl != null) && !roomData.cl) || (roomData.t === 'd')) {
			return false;
		} else {
			return true;
		}
	},

	route() {
		return RocketChat.roomTypes.getRouteLink(this.t, this);
	},

	archived() {
		return this.archived ? 'archived' : undefined;
	}
});

Template.chatRoomItem.rendered = function() {
	if (!(FlowRouter.getParam('_id') && (FlowRouter.getParam('_id') === this.data.rid)) && !this.data.ls && (this.data.alert === true)) {
		return KonchatNotification.newRoom(this.data.rid);
	}
};

Template.chatRoomItem.events({

	'click .open-room'() {
		return menu.close();
	},

	'click .hide-room'(e) {
		e.stopPropagation();
		e.preventDefault();

		const { rid } = this;
		const { name } = this;

		const warnText = (() => {
			switch (this.t) {
				case 'c': return 'Hide_Room_Warning';
				case 'p': return 'Hide_Group_Warning';
				case 'd': return 'Hide_Private_Warning';
			}
		})();

		return swal({
			title: t('Are_you_sure'),
			text: warnText ? t(warnText, name) : '',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_hide_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, function() {
			if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
				FlowRouter.go('home');
			}

			return Meteor.call('hideRoom', rid, function(err) {
				if (err) {
					return handleError(err);
				} else if (rid === Session.get('openedRoom')) {
					return Session.delete('openedRoom');
				}
			});
		});
	},

	'click .leave-room'(e) {
		e.stopPropagation();
		e.preventDefault();

		const { rid } = this;
		const { name } = this;

		const warnText = (() => {
			switch (false) {
				case this.t !== 'c': return 'Leave_Room_Warning';
				case this.t !== 'p': return 'Leave_Group_Warning';
				case this.t !== 'd': return 'Leave_Private_Warning';
			}
		})();
		return swal({
			title: t('Are_you_sure'),
			text: t(warnText, name),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_leave_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, function(isConfirm) {
			if (isConfirm) {
				return Meteor.call('leaveRoom', rid, function(err) {
					if (err) {
						return swal({
							title: t('Warning'),
							text: handleError(err, false),
							type: 'warning',
							html: false
						});

					} else {
						swal.close();
						if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
							FlowRouter.go('home');
						}

						return RoomManager.close(rid);
					}
				});
			} else {
				return swal.close();
			}
		});
	}
});
