import { api, Message, Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';
import { syncRoomRolePriorityForUserAndRoom } from '../lib/roles/syncRoomRolePriority';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeRoomModerator(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

export const removeRoomModerator = async (fromUserId: IUser['_id'], rid: IRoom['_id'], userId: IUser['_id']): Promise<boolean> => {
	check(rid, String);
	check(userId, String);

	const room = await Rooms.findOneById(rid, { projection: { t: 1, federated: 1 } });
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'removeRoomModerator',
		});
	}

	if (!(await hasPermissionAsync(fromUserId, 'set-moderator', rid)) && !isRoomFederated(room)) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'removeRoomModerator',
		});
	}

	const user = await Users.findOneById(userId);

	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'removeRoomModerator',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

	if (!subscription) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'removeRoomModerator',
		});
	}

	if (subscription.roles && (!Array.isArray(subscription.roles) || !subscription.roles.includes('moderator'))) {
		throw new Meteor.Error('error-user-not-moderator', 'User is not a moderator', {
			method: 'removeRoomModerator',
		});
	}

	const removeRoleResponse = await Subscriptions.removeRoleById(subscription._id, 'moderator');
	await syncRoomRolePriorityForUserAndRoom(userId, rid, subscription.roles?.filter((r) => r !== 'moderator') || []);

	if (removeRoleResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	const fromUser = await Users.findOneById(fromUserId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'removeRoomModerator',
		});
	}

	await Message.saveSystemMessage('subscription-role-removed', rid, user.username, fromUser, { role: 'moderator' });

	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.removeRolesFromMember(team._id, userId, ['moderator']);
	}

	const event = {
		type: 'removed',
		_id: 'moderator',
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
	void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: fromUserId });

	return true;
};

Meteor.methods<ServerMethods>({
	async removeRoomModerator(rid, userId) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeRoomModerator',
			});
		}

		return removeRoomModerator(uid, rid, userId);
	},
});
