Template.unreadRooms.helpers({
	hasUnread() {
		if ((Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.unreadRoomsMode) && (Template.instance().unreadRooms.length > 0)) {
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
			open: true,
			hideUnreadStatus: { $ne: true }
		};

		let subscriptions = ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }}).fetch();
		if (Session.equals('RoomSortType', 'activity')) {
			subscriptions = RocketChat.SubscriptionUtil.sortSubscriptionsByActivity(subscriptions);
		}
		return this.unreadRooms = subscriptions;
	});
});
