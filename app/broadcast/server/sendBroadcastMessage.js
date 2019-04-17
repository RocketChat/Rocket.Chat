import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Rooms, Users, Subscriptions } from '../../models/server';
import { sendMessage } from '../../lib/server';
import { settings } from '../../settings/server';

function createDirectRoom(source, target, extraData, options) {
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
}

Meteor.methods({
	sendBroadcastMessage(reply, users) {
		check(reply, String);
		check(users, Match.Optional([String]));

		if (!settings.get('Broadcast_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'sendBroadcastMessage' });
		}

		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'BroadcastCreation' });
		}
		for (const username of users) {
			const members = [user.username, username];
			let room = Rooms.findDirectRoomContainingAllUsernames(members, {});
			if (!room) {
				const target = Users.findOneByUsername(username, {});
				room = createDirectRoom(user, target, {}, {});
			}
			sendMessage(user, { msg: reply }, room);
		}
		return true;
	},
});

