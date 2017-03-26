Template.unreadRooms.helpers({
	hasUnread() {
		if ((Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.unreadRoomsMode) && (Template.instance().unreadRooms.count() > 0)) {
			return 'has-unread';
		}
	},

	rooms() {
		return Template.instance().unreadRooms;
	}
});

Template.unreadRooms.onCreated(function() {
	return this.autorun(() => {
		const query = {
			alert: true,
			open: true
		};

		let sort;
		if (Session.equals('RoomSortType', 'name')) {
			sort = { sort: { 't': 1, 'name': 1 }};
		} else {
			sort = { sort: { 'la': -1 }};
		}

		return this.unreadRooms = ChatSubscription.find(query, sort);
	});
});
