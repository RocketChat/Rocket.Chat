import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../../notifications';
import { Subscriptions, Users } from '../../../../models';

let SubscriptionRaw;
Meteor.startup(() => {
	SubscriptionRaw = Subscriptions.model.rawCollection();
});

export async function getNotificationsCount(uid) {
	const [result = {}] = await SubscriptionRaw.aggregate([
		{ $match: { 'u._id': uid } },
		{
			$group: {
				_id: 'total',
				unread: { $sum: '$unread' },
				userMentions: { $sum: '$userMentions' },
				groupMentions: { $sum: '$groupMentions' },
			},
		},
	]).toArray();

	const { unread, userMentions, groupMentions } = result;
	return { unread, userMentions, groupMentions };
}

const fields = {
	fields: { customFields: 1 },
};

export async function notifyStream(uid) {
	const { customFields } = Users.findOneById(uid, fields) || {};
	if (customFields)	{
		const notifications = await getNotificationsCount(uid);
		Notifications.notifyAdmin(uid, 'notifications-changed', {
			uid,
			customFields,
			notifications,
		});
	}
}

export function shouldNotifyStream() {
	return true;
}
