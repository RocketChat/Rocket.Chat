import { Rooms, Subscriptions } from '../../../models/server';

export const createDirectRoom = function(source, target, extraData, options) {
	const rid = [source._id, target._id].sort().join('');

	Rooms.upsert({ _id: rid }, {
		$setOnInsert: Object.assign({
			t: 'd',
			usernames: [source.username, target.username],
			msgs: 0,
			ts: new Date(),
		}, extraData),
	});

	Subscriptions.upsert({ rid, 'u._id': target._id }, {
		$setOnInsert: Object.assign({
			name: source.username,
			t: 'd',
			open: true,
			alert: true,
			unread: 0,
			u: {
				_id: target._id,
				username: target.username,
			},
		}, options.subscriptionExtra),
	});

	Subscriptions.upsert({ rid, 'u._id': source._id }, {
		$setOnInsert: Object.assign({
			name: target.username,
			t: 'd',
			open: true,
			alert: true,
			unread: 0,
			u: {
				_id: source._id,
				username: source.username,
			},
		}, options.subscriptionExtra),
	});

	return {
		_id: rid,
		t: 'd',
	};
};
