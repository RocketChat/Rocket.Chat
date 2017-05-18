Template.roomList.helpers({
	rooms() {
		const query = {
			t: { $in: [this.identifier]},
			open: true
		};

		if (RocketChat.settings.get('Favorite_Rooms')) {
			query.f = { $ne: true };
		}

		if (Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.unreadRoomsMode) {
			query.$or = [
				{ alert: { $ne: true } },
				{ hideUnreadStatus: true }
			];
		}

		return ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }});
	},

	favoritesCount() {
		return ChatSubscription.find({ f: true }).count();
	}
});

Template.roomList.events({
	'click .more-channels'() {
		SideNav.setFlex('listChannelsFlex');
		return SideNav.openFlex();
	}
});
