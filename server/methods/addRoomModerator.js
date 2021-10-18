import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../app/authorization';
import { Users, Subscriptions, Messages } from '../../app/models';
import { settings } from '../../app/settings';
import { api } from '../sdk/api';
import { Team } from '../sdk';

Meteor.methods({
	addRoomModerator(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		if (!hasPermission(Meteor.userId(), 'set-moderator', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addRoomModerator',
			});
		}

		const user = Users.findOneById(userId);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'addRoomModerator',
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('moderator') === true) {
			throw new Meteor.Error('error-user-already-moderator', 'User is already a moderator', {
				method: 'addRoomModerator',
			});
		}

		Subscriptions.addRoleById(subscription._id, 'moderator');

		const fromUser = Users.findOneById(Meteor.userId());

		Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
			role: 'moderator',
		});

		const team = Promise.await(Team.getOneByMainRoomId(rid));
		if (team) {
			Promise.await(Team.addRolesToMember(team._id, userId, ['moderator']));
		}

		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'added',
				_id: 'moderator',
				u: {
					_id: user._id,
					username: user.username,
					name: fromUser.name,
				},
				scope: rid,
			});
		}

		return true;
	},
});
