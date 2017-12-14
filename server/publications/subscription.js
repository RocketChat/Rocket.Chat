const fields = {
	t: 1,
	ts: 1,
	ls: 1,
	name: 1,
	fname: 1,
	rid: 1,
	code: 1,
	f: 1,
	u: 1,
	open: 1,
	alert: 1,
	roles: 1,
	unread: 1,
	userMentions: 1,
	groupMentions: 1,
	archived: 1,
	audioNotifications: 1,
	audioNotificationValue: 1,
	desktopNotifications: 1,
	desktopNotificationDuration: 1,
	mobilePushNotifications: 1,
	emailNotifications: 1,
	unreadAlert: 1,
	_updatedAt: 1,
	blocked: 1,
	blocker: 1,
	autoTranslate: 1,
	autoTranslateLanguage: 1,
	disableNotifications: 1,
	hideUnreadStatus: 1,
	usernames: 1,
	groupChat: 1
};

Meteor.methods({
	'subscriptions/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}

		this.unblock();

		const options = { fields };

		const records = RocketChat.models.Subscriptions.findByUserId(Meteor.userId(), options).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Subscriptions.trashFindDeletedAfter(updatedAt, {
					'u._id': Meteor.userId()
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1
					}
				}).fetch()
			};
		}

		return records;
	}
});

RocketChat.models.Subscriptions.on('changed', function(type, subscription) {
	RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', type, RocketChat.models.Subscriptions.processQueryOptionsOnResult(subscription, {
		fields
	}));
});

// TODO needs improvement
// We are sending the record again cuz any update on subscription will send the record without the fname (join)
// Then we need to sent it again listening to the join event.
RocketChat.models.Subscriptions.on('join:fname:inserted', function(subscription/*, user*/) {
	RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', 'changed', RocketChat.models.Subscriptions.processQueryOptionsOnResult(subscription, {
		fields
	}));
});
