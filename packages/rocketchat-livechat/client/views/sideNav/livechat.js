Template.livechat.helpers({
	isActive() {
		if (ChatSubscription.findOne({
			t: 'l',
			f: {
				$ne: true
			},
			open: true,
			rid: Session.get('openedRoom')
		}, {
			fields: {
				_id: 1
			}
		}) != null) {
			return 'active';
		}
	},
	rooms() {
		var query = {
			t: 'l',
			open: true
		};

		var user = Meteor.user();

		if (user && user.settings && user.settings.preferences && user.settings.preferences.unreadRoomsMode) {
			query.alert = {
				$ne: true
			};
		}

		return ChatSubscription.find(query, {
			sort: {
				't': 1,
				'name': 1
			}
		});
	},
	available() {
		const user = Meteor.user();
		return {
			status: user.statusLivechat,
			icon: user.statusLivechat === 'available' ? 'icon-toggle-on' : 'icon-toggle-off',
			hint: user.statusLivechat === 'available' ? t('Available') : t('Not_Available')
		};
	},
	livechatAvailable() {
		const user = Meteor.user();

		if (user) {
			return user.statusLivechat;
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
	}
});
