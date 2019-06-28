import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../app/settings';
import { hasPermission } from '../../app/authorization';
import { Users, Rooms, Subscriptions } from '../../app/models';
import { getDefaultSubscriptionPref } from '../../app/utils';
import { RateLimiter } from '../../app/lib';
import { callbacks } from '../../app/callbacks';
import { Federation } from '../../app/federation/server';

Meteor.methods({
	createDirectMessage(username) {
		check(username, String);

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

		if (settings.get('Message_AllowDirectMessagesToYourself') === false && me.username === username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		if (!hasPermission(Meteor.userId(), 'create-d')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'createDirectMessage',
			});
		}

		let to = Users.findOneByUsernameIgnoringCase(username);

		if (!to && username.indexOf('@') !== -1) {
			// If the username does have an `@`, but does not exist locally, we create it first
			const toId = Federation.methods.addUser(username);

			to = Users.findOneById(toId);
		}

		if (!to) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		if (!hasPermission(to._id, 'view-d-room')) {
			throw new Meteor.Error('error-not-allowed', 'Target user not allowed to receive messages', {
				method: 'createDirectMessage',
			});
		}

		const rid = [me._id, to._id].sort().join('');

		const now = new Date();

		// Make sure we have a room
		const roomUpsertResult = Rooms.upsert({
			_id: rid,
		}, {
			$set: {
				usernames: [me.username, to.username],
			},
			$setOnInsert: {
				t: 'd',
				msgs: 0,
				ts: now,
				usersCount: 2,
			},
		});

		const myNotificationPref = getDefaultSubscriptionPref(me);

		// Make user I have a subcription to this room
		const upsertSubscription = {
			$set: {
				ls: now,
				open: true,
			},
			$setOnInsert: {
				fname: to.name,
				name: to.username,
				t: 'd',
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				customFields: me.customFields,
				u: {
					_id: me._id,
					username: me.username,
				},
				ts: now,
				...myNotificationPref,
			},
		};

		if (to.active === false) {
			upsertSubscription.$set.archived = true;
		}

		if (to.u !== undefined) {
			upsertSubscription.$set.sa = true;
		}

		Subscriptions.upsert({
			rid,
			$and: [{ 'u._id': me._id }], // work around to solve problems with upsert and dot
		}, upsertSubscription);

		const toNotificationPref = getDefaultSubscriptionPref(to);

		Subscriptions.upsert({
			rid,
			$and: [{ 'u._id': to._id }], // work around to solve problems with upsert and dot
		}, {
			$setOnInsert: {
				fname: me.name,
				name: me.username,
				t: 'd',
				open: false,
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				customFields: to.customFields,
				u: {
					_id: to._id,
					username: to.username,
				},
				ts: now,
				...toNotificationPref,
			},
		});

		// If the room is new, run a callback
		if (roomUpsertResult.insertedId) {
			const insertedRoom = Rooms.findOneById(rid);

			callbacks.run('afterCreateDirectRoom', insertedRoom, { from: me, to });
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
