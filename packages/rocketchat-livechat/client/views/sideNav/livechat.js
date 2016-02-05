Template.livechat.helpers({
	isActive: function() {
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
	rooms: function() {
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
	}
});

Template.livechat.events({
});
