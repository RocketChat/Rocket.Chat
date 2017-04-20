

Template.channels.helpers({
	isActive() {
		if (ChatSubscription.findOne({ t: { $in: ['c']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } }) !== null) {
			return 'active';
		}
	},

	rooms() {
		const query = {
			t: { $in: ['c']},
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

		return ChatSubscription.find(
			query, { sort: { 't': 1, 'name': 1 }});
	}
});

Template.channels.events({
	'click .more-channels'() {
		SideNav.setFlex('listChannelsFlex');
		return SideNav.openFlex();
	}
});
