Template.combined.helpers({
	isActive() {
		if (ChatSubscription.findOne({ t: { $in: ['c', 'p']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })) {
			return 'active';
		}
	},

	rooms() {
		const query = {
			t: { $in: ['c', 'p']},
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

		let subscriptions = ChatSubscription.find(query, { sort: {'name': 1 }}).fetch();
		if (Session.equals('RoomSortType', 'activity')) {
			subscriptions = RocketChat.SubscriptionUtil.sortSubscriptionsByActivity(subscriptions);
		}
		return subscriptions;
	}});

Template.combined.events({
	'click .more-channels'() {
		SideNav.setFlex('listCombinedFlex');
		return SideNav.openFlex();
	}
});
