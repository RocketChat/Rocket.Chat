Template.directMessages.helpers({
	isActive() {
		if (ChatSubscription.findOne({ t: { $in: ['d']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })) {
			return 'active';
		}
	},

	rooms() {
		const query = { t: { $in: ['d']}, f: { $ne: true }, open: true };

		if (Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.unreadRoomsMode) {
			query.alert =
				{$ne: true};
		}

		return ChatSubscription.find(query, { sort: { 't': 1, 'name': 1 }});
	}
});
