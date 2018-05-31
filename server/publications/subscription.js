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
	muteGroupMentions: 1,
	ignored: 1
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

// TODO: CACHE: fname needs improvement
// We are sending the record again cuz any update on subscription will send the record without the fname (join)
// Then we need to sent it again listening to the join event.
// RocketChat.models.Subscriptions.on('join:fname:inserted', function(subscription/*, user*/) {
// 	RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', 'changed', RocketChat.models.Subscriptions.processQueryOptionsOnResult(subscription, {
// 		fields
// 	}));
// });

RocketChat.models.Subscriptions.on('change', ({action, id}) => {
	switch (action) {
		case 'update:record':
		case 'update:diff':
		case 'insert':
			const subscription = RocketChat.models.Subscriptions.findOneById(id, { fields });
			RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', (action === 'insert' ? 'inserted' : 'updated'), subscription);
			break;

		case 'remove':
			const removedSubscription = RocketChat.models.Subscriptions.trashFindOneById(id, { fields: { u: 1 } });
			RocketChat.Notifications.notifyUserInThisInstance(removedSubscription.u._id, 'subscriptions-changed', 'removed', { _id: id });
			break;
	}
});
