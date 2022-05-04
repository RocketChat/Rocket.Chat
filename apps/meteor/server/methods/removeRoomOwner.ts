import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission, getUsersInRole } from '../../app/authorization/server';
import { Users, Subscriptions, Messages } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { api } from '../sdk/api';
import { Team } from '../sdk';

Meteor.methods({
	async removeRoomOwner(rid, userId) {
		check(rid, String);
		check(userId, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner',
			});
		}

		if (!hasPermission(uid, 'set-owner', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeRoomOwner',
			});
		}

		const user = Users.findOneById(userId);
		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'removeRoomOwner',
			});
		}

		if (Array.isArray(subscription.roles) === false || subscription.roles.includes('owner') === false) {
			throw new Meteor.Error('error-user-not-owner', 'User is not an owner', {
				method: 'removeRoomOwner',
			});
		}

		const numOwners = await (await getUsersInRole('owner', rid)).count();

		if (numOwners === 1) {
			throw new Meteor.Error('error-remove-last-owner', 'This is the last owner. Please set a new owner before removing this one.', {
				method: 'removeRoomOwner',
			});
		}

		Subscriptions.removeRoleById(subscription._id, 'owner');

		const fromUser = Users.findOneById(uid);

		Messages.createSubscriptionRoleRemovedWithRoomIdAndUser(rid, user, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
			role: 'owner',
		});

		const team = await Team.getOneByMainRoomId(rid);
		if (team) {
			await Team.removeRolesFromMember(team._id, userId, ['owner']);
		}

		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'removed',
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
