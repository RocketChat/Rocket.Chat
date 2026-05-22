import { api, Message, Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../app/lib/server/lib/notifyListener';
import { settings } from '../../app/settings/server';
import { syncRoomRolePriorityForUserAndRoom } from '../lib/roles/syncRoomRolePriority';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addRoomLeader(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

export const addRoomLeader = async (fromUserId: IUser['_id'], rid: IRoom['_id'], userId: IUser['_id']): Promise<boolean> => {
	check(rid, String);
	check(userId, String);

	if (!(await hasPermissionAsync(fromUserId, 'set-leader', rid))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'addRoomLeader',
		});
	}

	const user = await Users.findOneById(userId);

	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'addRoomLeader',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'addRoomLeader',
		});
	}

	if (subscription.roles && Array.isArray(subscription.roles) === true && subscription.roles.includes('leader') === true) {
		throw new Meteor.Error('error-user-already-leader', 'User is already a leader', {
			method: 'addRoomLeader',
		});
	}

	const addRoleResponse = await Subscriptions.addRoleById(subscription._id, 'leader');
	await syncRoomRolePriorityForUserAndRoom(userId, rid, subscription.roles?.concat(['leader']) || ['leader']);

	if (addRoleResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	const fromUser = await Users.findOneById(fromUserId);

	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'addRoomLeader',
		});
	}

	await Message.saveSystemMessage('subscription-role-added', rid, user.username, fromUser, { role: 'leader' });

	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.addRolesToMember(team._id, userId, ['leader']);
	}

	if (settings.get<boolean>('UI_DisplayRoles')) {
		void api.broadcast('user.roleUpdate', {
			type: 'added',
			_id: 'leader',
			u: {
				_id: user._id,
				username: user.username,
			},
			scope: rid,
		});
	}

	return true;
};

Meteor.methods<ServerMethods>({
	async addRoomLeader(rid, userId) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomLeader',
			});
		}

		return addRoomLeader(uid, rid, userId);
	},
});
