import { Meteor } from 'meteor/meteor';

import { Subscriptions } from '../../../app/models';
import './emitter';

export const fields = {
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
	tunread: 1,
};

const options = { fields };

Meteor.methods({
	'subscriptions/get'(updatedAt) {
		const uid = Meteor.userId();
		if (!uid) {
			return [];
		}

		if (updatedAt instanceof Date) {
			return {
				update: Subscriptions.findByUserIdUpdatedAfter(uid, updatedAt, options).fetch(),
				remove: Subscriptions.trashFindDeletedAfter(updatedAt, {
					'u._id': uid,
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1,
					},
				}).fetch(),
			};
		}

		return Subscriptions.findByUserId(uid, options).fetch();
	},
});
