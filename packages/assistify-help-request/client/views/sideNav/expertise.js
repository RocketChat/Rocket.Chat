Template.expertise.helpers({
	isActive() {
		if (ChatSubscription.findOne({
			t: {$in: ['e']},
			f: {$ne: true},
			open: true,
			rid: Session.get('openedRoom')
		}, {fields: {_id: 1}})) {
			return 'active';
		}
	},

	rooms() {
		const query = {
			t: {$in: ['e']},
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

Template.expertise.events({
	'click .more-channels'() {
		SideNav.setFlex('listChannelsFlex');
		SideNav.openFlex();
	}
});
