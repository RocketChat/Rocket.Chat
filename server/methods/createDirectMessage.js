import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../app/settings';
import { hasPermission } from '../../app/authorization';
import { Users, Rooms } from '../../app/models';
import { RateLimiter } from '../../app/lib';
import { callbacks } from '../../app/callbacks';
import { addUser } from '../../app/federation/server/functions/addUser';
import { createDirectRoom } from '../../app/lib/server';

Meteor.methods({
	createDirectMessage(...usernames) {
		check(usernames, [String]);

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

		if (!hasPermission(Meteor.userId(), 'create-d')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
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

			if (!hasPermission(to._id, 'view-d-room')) {
				throw new Meteor.Error('error-not-allowed', `Target user ${ username } not allowed to receive messages`, {
					method: 'createDirectMessage',
				});
			}
			return to;
		});

		const { _id: rid, inserted } = createDirectRoom([me, ...users], { }, { creator: me._id });

		// If the room is new, run a callback
		if (inserted) {
			const insertedRoom = Rooms.findOneById(rid);
			callbacks.run('afterCreateDirectRoom', insertedRoom, { from: me, to: users[0] }); // TODO CHECK FEDERATION
		}

		return {
			rid,
		};
	},
});

RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});
