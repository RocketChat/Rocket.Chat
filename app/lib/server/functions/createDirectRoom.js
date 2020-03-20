import { Rooms, Subscriptions } from '../../../models/server';
import { getDefaultSubscriptionPref } from '../../../utils/server';
import { callbacks } from '../../../callbacks/server';

export const createDirectRoom = function(source, target, extraData, options) {
	const rid = [source._id, target._id].sort().join('');

	const now = new Date();

	const roomUpsertResult = Rooms.upsert({ _id: rid }, {
		$set: {
			usernames: [source.username, target.username],
		},
		$setOnInsert: Object.assign({
			t: 'd',
			msgs: 0,
			ts: now,
			usersCount: 2,
		}, extraData),
	});

	const targetNotificationPref = getDefaultSubscriptionPref(target);

	Subscriptions.upsert({ rid, 'u._id': target._id }, {
		$setOnInsert: Object.assign({
			fname: source.name,
			name: source.username,
			t: 'd',
			open: false,
			alert: false,
			unread: 0,
			userMentions: 0,
			groupMentions: 0,
			customFields: target.customFields,
			u: {
				_id: target._id,
				username: target.username,
			},
			ts: now,
			...targetNotificationPref,
		}, options.subscriptionExtra),
	});

	const sourceNotificationPref = getDefaultSubscriptionPref(source);

	Subscriptions.upsert({ rid, 'u._id': source._id }, {
		$set: {
			ls: now,
			open: true,
			...target.active === false && {
				archived: true,
			},
		},
		$setOnInsert: Object.assign({
			fname: target.name,
			name: target.username,
			t: 'd',
			alert: false,
			unread: 0,
			userMentions: 0,
			groupMentions: 0,
			customFields: source.customFields,
			u: {
				_id: source._id,
				username: source.username,
			},
			ts: now,
			...sourceNotificationPref,
		}, options.subscriptionExtra),
	});

	// If the room is new, run a callback
	if (roomUpsertResult.insertedId) {
		const insertedRoom = Rooms.findOneById(rid);

		callbacks.run('afterCreateDirectRoom', insertedRoom, { from: source, to: target });
	}

	return {
		_id: rid,
		t: 'd',
	};
};
