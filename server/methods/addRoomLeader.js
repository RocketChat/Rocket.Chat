import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../app/authorization';
import { Users, Subscriptions, Messages } from '../../app/models';
import { settings } from '../../app/settings';
import { api } from '../sdk/api';
import { Team } from '../sdk';

Meteor.methods({
	addRoomLeader(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomLeader',
			});
		}

		if (!hasPermission(Meteor.userId(), 'set-leader', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addRoomLeader',
			});
		}

		const user = Users.findOneById(userId);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomLeader',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'addRoomLeader',
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('leader') === true) {
			throw new Meteor.Error('error-user-already-leader', 'User is already a leader', {
				method: 'addRoomLeader',
			});
		}

		Subscriptions.addRoleById(subscription._id, 'leader');

		const fromUser = Users.findOneById(Meteor.userId());

		Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
			role: 'leader',
		});

		const team = Promise.await(Team.getOneByMainRoomId(rid));
		if (team) {
			Promise.await(Team.addRolesToMember(team._id, userId, ['leader']));
		}

		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'added',
				_id: 'leader',
				u: {
					_id: user._id,
					username: user.username,
					name: user.name,
				},
				scope: rid,
			});
		}

		return true;
	},
});
