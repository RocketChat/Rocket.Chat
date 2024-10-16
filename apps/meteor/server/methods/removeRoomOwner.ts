import { api, Message, Team } from '@rocket.chat/core-services';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { getUsersInRole } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeRoomOwner(rid: string, userId: string): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async removeRoomOwner(rid, userId) {
		check(rid, String);
		check(userId, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner',
			});
		}

		const room = await Rooms.findOneById(rid, { projection: { t: 1, federated: 1 } });
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'removeRoomOwner',
			});
		}

		if (!(await hasPermissionAsync(uid, 'set-owner', rid)) && !isRoomFederated(room)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeRoomOwner',
			});
		}

		const user = await Users.findOneById(userId);
		if (!user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

		if (!subscription) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'removeRoomOwner',
			});
		}

		if (Array.isArray(subscription.roles) === false || subscription.roles?.includes('owner') === false) {
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

		const removeRoleResponse = await Subscriptions.removeRoleById(subscription._id, 'owner');
		if (removeRoleResponse.modifiedCount) {
			void notifyOnSubscriptionChangedById(subscription._id);
		}

		const fromUser = await Users.findOneById(uid);
		if (!fromUser) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomOwner',
			});
		}

		await Message.saveSystemMessage('subscription-role-removed', rid, user.username, fromUser, { role: 'owner' });

		const team = await Team.getOneByMainRoomId(rid);
		if (team) {
			await Team.removeRolesFromMember(team._id, userId, ['owner']);
		}

		const event = {
			type: 'removed',
			_id: 'owner',
			u: {
				_id: user._id,
				username: user.username,
				name: user.name,
			},
			scope: rid,
		} as const;
		if (settings.get('UI_DisplayRoles')) {
			void api.broadcast('user.roleUpdate', event);
		}
		void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: uid });
		return true;
	},
});
