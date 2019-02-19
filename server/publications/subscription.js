import { Meteor } from 'meteor/meteor';

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
	prid: 1,
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
	ignored: 1,
	E2EKey: 1,
};

Meteor.methods({
	'subscriptions/get'(updatedAt) {
		if (!Meteor.userId()) {
			return [];
		}

		const options = { fields };

		const records = RocketChat.models.Subscriptions.findByUserId(Meteor.userId(), options).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter(function(record) {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Subscriptions.trashFindDeletedAfter(updatedAt, {
					'u._id': Meteor.userId(),
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1,
					},
				}).fetch(),
			};
		}

		return records;
	},
});

RocketChat.models.Subscriptions.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'inserted':
		case 'updated':
			// Override data cuz we do not publish all fields
			data = RocketChat.models.Subscriptions.findOneById(id, { fields });
			break;

		case 'removed':
			data = RocketChat.models.Subscriptions.trashFindOneById(id, { fields: { u: 1, rid: 1 } });
			break;
	}

	RocketChat.Notifications.streamUser.__emit(data.u._id, clientAction, data);

	RocketChat.Notifications.notifyUserInThisInstance(data.u._id, 'subscriptions-changed', clientAction, data);
});
