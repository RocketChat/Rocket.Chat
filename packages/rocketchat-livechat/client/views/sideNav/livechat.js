/* globals LivechatInquiry, KonchatNotification */
Template.livechat.helpers({
	isActive() {
		const query = {
			t: 'l',
			f: { $ne: true },
			open: true,
			rid: Session.get('openedRoom')
		};

		const options = { fields: { _id: 1 } };

		if (ChatSubscription.findOne(query, options)) {
			return 'active';
		}
	},

	rooms() {
		const query = {
			t: 'l',
			open: true
		};

		const user = RocketChat.models.Users.findOne(Meteor.userId(), {
			fields: { 'settings.preferences.unreadRoomsMode': 1 }
		});

		if (user && user.settings && user.settings.preferences && user.settings.preferences.unreadRoomsMode) {
			query.alert = { $ne: true };
		}

		return ChatSubscription.find(query, { sort: {
			't': 1,
			'name': 1
		}});
	},

	inquiries() {
		// get all inquiries of the department
		const inqs = LivechatInquiry.find({
			agents: Meteor.userId(),
			status: 'open'
		}, {
			sort: {
				'ts' : 1
			}
		});

		// for notification sound
		inqs.forEach((inq) => {
			KonchatNotification.newRoom(inq.rid);
		});

		return inqs;
	},

	guestPool() {
		return RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool';
	},

	available() {
		const statusLivechat = Template.instance().statusLivechat.get();

		return {
			status: statusLivechat === 'available' ? 'status-online' : 'status-offline',
			icon: statusLivechat === 'available' ? 'icon-toggle-on' : 'icon-toggle-off',
			hint: statusLivechat === 'available' ? t('Available') : t('Not_Available')
		};
	},

	livechatAvailable() {
		return Template.instance().statusLivechat.get();
	},

	isLivechatAvailable() {
		return Template.instance().statusLivechat.get() === 'available';
	},

	showQueueLink() {
		if (RocketChat.settings.get('Livechat_Routing_Method') !== 'Least_Amount') {
			return false;
		}
		return RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager') || (Template.instance().statusLivechat.get() === 'available' && RocketChat.settings.get('Livechat_show_queue_list_link'));
	},

	activeLivechatQueue() {
		FlowRouter.watchPathChange();
		if (FlowRouter.current().route.name === 'livechat-queue') {
			return 'active';
		}
	}
});

Template.livechat.events({
	'click .livechat-status'() {
		Meteor.call('livechat:changeLivechatStatus', (err /*, results*/) => {
			if (err) {
				return handleError(err);
			}
		});
	},

	'click .inquiries .open-room'(event) {
		event.preventDefault();
		event.stopPropagation();

		swal({
			title: t('Livechat_Take_Confirm'),
			text: `${ t('Message') }: ${ this.message }`,
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: t('Take_it')
		}, (isConfirm) => {
			if (isConfirm) {
				Meteor.call('livechat:takeInquiry', this._id, (error, result) => {
					if (!error) {
						RocketChat.roomTypes.openRouteLink(result.t, result);
					}
				});
			}
		});
	}
});

Template.livechat.onCreated(function() {
	this.statusLivechat = new ReactiveVar();

	this.autorun(() => {
		if (Meteor.userId()) {
			const user = RocketChat.models.Users.findOne(Meteor.userId(), { fields: { statusLivechat: 1 } });
			this.statusLivechat.set(user.statusLivechat);
		} else {
			this.statusLivechat.set();
		}
	});

	this.subscribe('livechat:inquiry');
});
