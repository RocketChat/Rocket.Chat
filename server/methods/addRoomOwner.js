import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../app/authorization';
import { Users, Subscriptions, Messages } from '../../app/models';
import { Team } from '../sdk';
import { settings } from '../../app/settings';
import { api } from '../sdk/api';

Meteor.methods({
	addRoomOwner(rid, userId) {
		check(rid, String);
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomOwner',
			});
		}

		if (!hasPermission(Meteor.userId(), 'set-owner', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'addRoomOwner',
			});
		}

		const user = Users.findOneById(userId);

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomOwner',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'addRoomOwner',
			});
		}

		if (Array.isArray(subscription.roles) === true && subscription.roles.includes('owner') === true) {
			throw new Meteor.Error('error-user-already-owner', 'User is already an owner', {
				method: 'addRoomOwner',
			});
		}

		Subscriptions.addRoleById(subscription._id, 'owner');

		const fromUser = Users.findOneById(Meteor.userId());

		Messages.createSubscriptionRoleAddedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
			role: 'owner',
		});

		const team = Promise.await(Team.getOneByMainRoomId(rid));
		if (team) {
			Promise.await(Team.addRolesToMember(team._id, userId, ['owner']));
		}

		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'added',
				_id: 'owner',
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
