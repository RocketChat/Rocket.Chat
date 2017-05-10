Template.starredRooms.helpers({
	isActive() {
		if (ChatSubscription.findOne({ f: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })) {
			return 'active';
		}
	},

	rooms() {
		const query = { f: true, open: true };

		if (Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.unreadRoomsMode) {
			query.$or = [
				{ alert: { $ne: true } },
				{ hideUnreadStatus: true }
			];
		}

		return ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }
		});
	},
	total() {
		return ChatSubscription.find({ f: true }).count();
	}
});
