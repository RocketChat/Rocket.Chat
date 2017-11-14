/* globals menu popover */
Template.sidebarItem.helpers({
	or(...args) {
		args.pop();
		return args.some(arg => arg);
	},
	isRoom() {
		return this.rid || this._id;
	},
	roomId: function() {
		let subData = RocketChat.models.Subscriptions.findOne({
			'rid': this.rid
		});
		return subData != null ? subData.rid : void 0;
	},
	originalId: function() {
		let subData = RocketChat.models.Subscriptions.findOne({
			'rid': this.rid
		});
		return subData != null ? subData.originalRoomId : void 0;
	},
	hasSubGroups: function() {
		let subData = RocketChat.models.Subscriptions.findOne({
			'rid': this.rid
		});
		if (!(subData != null ? subData.subGroup : 0)) {
			let numSubs = RocketChat.models.Subscriptions.find({
				'originalRoomId': this.rid,
				'subGroup': true
			}).count();
			return numSubs >= 1;
		} else {
			return false;
		}
	},
	subGroups: function() {
		let subData = RocketChat.models.Subscriptions.findOne({
			'rid': this.rid
		});
		if (subData) {
			let subs = RocketChat.models.Subscriptions.find({
				'originalRoomId': this.rid,
				'subGroup': true
			}).fetch();
			if (subs.length) {
				subs = subs.map(sub => {
					let name = sub.name;
					const realNameForDirectMessages = RocketChat.settings.get('UI_Use_Real_Name') && sub.t === 'd';
					const realNameForChannel = RocketChat.settings.get('UI_Allow_room_names_with_special_chars') && sub.t !== 'd';

					let unread = false;
					if (((FlowRouter.getParam('_id') !== sub.rid) || !document.hasFocus()) && (sub.unread > 0)) {
						unread = sub.unread;
					}

					let active = false;
					if ([sub.rid, sub._id].find(id => id === Session.get('openedRoom'))) {
						active = true;
					}

					const archivedClass = sub.archived ? 'archived' : false;

					let alertClass = false;
					if (!sub.hideUnreadStatus && (FlowRouter.getParam('_id') !== sub.rid || !document.hasFocus()) && sub.alert) {
						alertClass = 'sidebar-item__link--active';
					}
					// Sound notification
					if (!(FlowRouter.getParam('name') === sub.name) && !sub.ls && sub.alert === true) {
						KonchatNotification.newRoom(sub.rid);
					}

					return {
						...sub,
						route: RocketChat.roomTypes.getRouteLink(sub.t, sub),
						name,
						unread,
						active,
						archivedClass,
						alertClass,
						statusClass: sub.t === 'd' ? Session.get(`user_${ sub.name }_status`) || 'offline' : sub.t === 'l' ? RocketChat.roomTypes.getUserStatus(sub.t, sub.rid) || 'offline' : false
					};
				});
			}
			return subs;
		}
	}
});

Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'() {
		return menu.close();
	},
	'click .sidebar-item__menu'(e) {
		// can't hide or leave parent room until you've left all subgroups
		const canLeave = () => {
			const roomData = Session.get(`roomData${ this.rid }`);

			if (!roomData) { return false; }

			return !(((roomData.cl != null) && !roomData.cl) || (['d', 'l'].includes(roomData.t)));
		};
		// can't hide subgroups (they're collapsible)
		const canHide = () => {
			return !this.subGroup;
		}
		e.preventDefault();
		const items = [];
		if (canHide()) {
			items.push({
				icon: 'eye-off',
				name: t('Hide_room'),
				type: 'sidebar-item',
				id: 'hide'
			});
		}
		if (canLeave()) {
			items.push({
				icon: 'sign-out',
				name: t('Leave_room'),
				type: 'sidebar-item',
				id: 'leave',
				modifier: 'error'
			});
		}
		const config = {
			popoverClass: 'sidebar-item',
			columns: [
				{
					groups: [
						{
							items
						}
					]
				}
			],
			mousePosition: {
				x: e.clientX,
				y: e.clientY
			},
			data: {
				template: this.t,
				rid: this.rid,
				name: this.name
			}
		};

		popover.open(config);
	},
	'click .collapser-button'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		if ($(e.currentTarget).hasClass('collapsed')) {
			$(e.currentTarget).removeClass('collapsed icon-right-dir');
			$(e.currentTarget).addClass('icon-down-dir');
			$(e.currentTarget).parent().parent().nextAll().each(function(i) {
				if ($(this).hasClass('child-room')) {
					$(this).show();
				} else {
					return false;
				}
			});
		} else {
			$(e.currentTarget).removeClass('icon-down-dir');
			$(e.currentTarget).addClass('collapsed icon-right-dir');
			$(e.currentTarget).parent().parent().nextAll().each(function(i) {
				if ($(this).hasClass('child-room')) {
					$(this).hide();
				} else {
					return false;
				}
			});
		}
	}
});
