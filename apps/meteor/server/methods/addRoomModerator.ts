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
import { isFederationEnabled, isFederationReady, FederationMatrixInvalidConfigurationError } from '../services/federation/utils';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addRoomModerator(rid: IRoom['_id'], userId: IUser['_id']): boolean;
	}
}

export const addRoomModerator = async (fromUserId: IUser['_id'], rid: IRoom['_id'], userId: IUser['_id']): Promise<boolean> => {
	check(rid, String);
	check(userId, String);

	const room = await Rooms.findOneById(rid, { projection: { t: 1, federated: 1 } });
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'addRoomModerator',
		});
	}

	const isFederated = isRoomFederated(room);

	if (!(await hasPermissionAsync(fromUserId, 'set-moderator', rid)) && !isFederated) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'addRoomModerator',
		});
	}

	if (isFederated && (!isFederationEnabled() || !isFederationReady())) {
		throw new FederationMatrixInvalidConfigurationError('unable to change room owners');
	}

	const user = await Users.findOneById(userId);

	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'addRoomModerator',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
			method: 'addRoomModerator',
		});
	}

	if (subscription.roles && Array.isArray(subscription.roles) === true && subscription.roles.includes('moderator') === true) {
		throw new Meteor.Error('error-user-already-moderator', 'User is already a moderator', {
			method: 'addRoomModerator',
		});
	}

	const addRoleResponse = await Subscriptions.addRoleById(subscription._id, 'moderator');
	await syncRoomRolePriorityForUserAndRoom(userId, rid, subscription.roles?.concat(['moderator']) || ['moderator']);

	if (addRoleResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	const fromUser = await Users.findOneById(fromUserId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'addRoomLeader',
		});
	}

	await Message.saveSystemMessage('subscription-role-added', rid, user.username, fromUser, { role: 'moderator' });

	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.addRolesToMember(team._id, userId, ['moderator']);
	}

	const event = {
		type: 'added',
		_id: 'moderator',
		u: {
			_id: user._id,
			username: user.username,
			name: fromUser.name,
		},
		scope: rid,
	} as const;

	if (settings.get<boolean>('UI_DisplayRoles')) {
		void api.broadcast('user.roleUpdate', event);
	}

	void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: fromUserId });

	return true;
};

Meteor.methods<ServerMethods>({
	async addRoomModerator(rid, userId) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addRoomModerator',
			});
		}

		return addRoomModerator(uid, rid, userId);
	},
});
