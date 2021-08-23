import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { settings } from '../../app/settings';
import { hasPermission } from '../../app/authorization';
import { Users, Rooms } from '../../app/models';
import { RateLimiter } from '../../app/lib';
import { addUser } from '../../app/federation/server/functions/addUser';
import { createRoom } from '../../app/lib/server';

export function createDirectMessage(usernames, excludeSelf) {
	check(usernames, [String]);
	check(excludeSelf, Match.Optional(Boolean));

	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const me = Meteor.user();

	if (!me.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (settings.get('Message_AllowDirectMessagesToYourself') === false && usernames.length === 1 && me.username === usernames[0]) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	const users = usernames.filter((username) => username !== me.username).map((username) => {
		let to = Users.findOneByUsernameIgnoringCase(username);

		// If the username does have an `@`, but does not exist locally, we create it first
		if (!to && username.indexOf('@') !== -1) {
			to = addUser(username);
		}

		if (!to) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}
		return to;
	});

	const roomUsers = excludeSelf ? users : [me, ...users];

	if (roomUsers.length === 1) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDirectMessage',
		});
	}

	if (!hasPermission(Meteor.userId(), 'create-d')) {
		// If the user can't create DMs but can access already existing ones
		if (hasPermission(Meteor.userId(), 'view-d-room')) {
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
	const { _id: rid, inserted, ...room } = createRoom('d', null, null, roomUsers, null, { }, options);

	return {
		t: 'd',
		rid,
		...room,
	};
}

Meteor.methods({
	createDirectMessage(...usernames) {
		return createDirectMessage(usernames, false);
	},
});

RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});
