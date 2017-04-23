Template.requests.helpers({
	isActive: function() {
		if (ChatSubscription.findOne({
			t: {$in: ['r']},
			f: {$ne: true},
			open: true,
			rid: Session.get('openedRoom')
		}, {fields: {_id: 1}})) {
			return 'active';
		}
	},

	rooms: function() {
		const query = {
			t: {$in: ['r']},
			open: true
		};

		if (RocketChat.settings.get('Favorite_Rooms')) {
			query.f = {$ne: true};
		}

		const user = Meteor.user();
		if (user && user.settings && user.settings.preferences && user.settings.preferences.unreadRoomsMode) {
			query.alert = {
				$ne: true
			};
		}

		return ChatSubscription.find(query, {sort: {'t': 1, 'name': 1}});
	}
});

Template.requests.events({
	'click .js-more-requests': function() {
		SideNav.setFlex('listRequestsFlex');
		SideNav.openFlex();
	}
});
