import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { settings } from '../../app/settings/server';
import { hasPermission } from '../../app/authorization/server';
import { Users, Rooms } from '../../app/models/server';
import { createRoom, RateLimiter } from '../../app/lib/server';
import { addUser } from '../../app/federation/server/functions/addUser';

export function createDirectMessage(usernames, userId, excludeSelf = false) {
	check(usernames, [String]);
	check(userId, String);
	check(excludeSelf, Match.Optional(Boolean));

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const me = Users.findOneById(userId, { fields: { username: 1, name: 1 } });
	if (!me?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (settings.get('Message_AllowDirectMessagesToYourself') === false && usernames.length === 1 && me.username === usernames[0]) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const users = usernames
		.filter((username) => username !== me.username)
		.map((username) => {
			let to = Users.findOneByUsernameIgnoringCase(username);

			// If the username does have an `@`, but does not exist locally, we create it first
			if (!to && username.indexOf('@') !== -1) {
				to = Promise.await(addUser(username));
			}

			if (!to) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'createDirectMessage',
				});
			}
			return to;
		});

	const roomUsers = excludeSelf ? users : [me, ...users];

	// allow self-DMs
	if (roomUsers.length === 1 && roomUsers[0]._id !== me._id) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (!hasPermission(userId, 'create-d')) {
		// If the user can't create DMs but can access already existing ones
		if (hasPermission(userId, 'view-d-room')) {
			// Check if the direct room already exists, then return it
			const uids = roomUsers.map(({ _id }) => _id).sort();
			const room = Rooms.findOneDirectRoomContainingAllUserIDs(uids, { fields: { _id: 1 } });
			if (room) {
				return {
					t: 'd',
					rid: room._id,
					...room,
				};
			}
		}

		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'createDirectMessage',
		});
	}

	const options = { creator: me._id };
	if (excludeSelf && hasPermission(this.userId, 'view-room-administration')) {
		options.subscriptionExtra = { open: true };
	}
	const { _id: rid, inserted, ...room } = createRoom('d', null, null, roomUsers, null, {}, options);

	return {
		t: 'd',
		rid,
		...room,
	};
}

Meteor.methods({
	createDirectMessage(...usernames) {
		return createDirectMessage(usernames, Meteor.userId());
	},
});

RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});
