Template.directMessages.helpers({
	isActive() {
		if (ChatSubscription.findOne({ t: { $in: ['d']}, f: { $ne: true }, open: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })) {
			return 'active';
		}
	},

	rooms() {
		const query = { t: { $in: ['d']}, f: { $ne: true }, open: true };
		const sort = { 't': 1 };

		if (Meteor.user() && Meteor.user().settings && Meteor.user().settings.preferences && Meteor.user().settings.preferences.unreadRoomsMode) {
			query.$or = [
				{ alert: { $ne: true } },
				{ hideUnreadStatus: true }
			];
		}

		if (RocketChat.settings.get('UI_Use_Real_Name')) {
			sort.fname = 1;
		}
		sort.name = 1;

		return ChatSubscription.find(query, { sort });
	}
});
