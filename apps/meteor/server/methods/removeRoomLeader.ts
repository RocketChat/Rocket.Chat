import { api, Message, Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeRoomLeader(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async removeRoomLeader(rid, userId) {
		check(rid, String);
		check(userId, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomLeader',
			});
		}

		if (!(await hasPermissionAsync(uid, 'set-leader', rid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeRoomLeader',
			});
		}

		const user = await Users.findOneById(userId);

		if (!user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomLeader',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeRoomLeader',
			});
		}

		if (subscription.roles && Array.isArray(subscription.roles) === true && subscription.roles.includes('leader') === false) {
			throw new Meteor.Error('error-user-not-leader', 'User is not a leader', {
				method: 'removeRoomLeader',
			});
		}

		const removeRoleResponse = await Subscriptions.removeRoleById(subscription._id, 'leader');
		if (removeRoleResponse.modifiedCount) {
			void notifyOnSubscriptionChangedById(subscription._id);
		}

		const fromUser = await Users.findOneById(uid);
		if (!fromUser) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomLeader',
			});
		}

		await Message.saveSystemMessage('subscription-role-removed', rid, user.username, fromUser, { role: 'leader' });

		const team = await Team.getOneByMainRoomId(rid);
		if (team) {
			await Team.removeRolesFromMember(team._id, userId, ['leader']);
		}

		if (settings.get('UI_DisplayRoles')) {
			void api.broadcast('user.roleUpdate', {
				type: 'removed',
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
