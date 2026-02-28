import { api, Message, Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Subscriptions, Rooms, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server';
import { beforeChangeRoomRole } from '../../lib/callbacks/beforeChangeRoomRole';
import { syncRoomRolePriorityForUserAndRoom } from '../../lib/roles/syncRoomRolePriority';
import { isFederationEnabled, FederationMatrixInvalidConfigurationError } from '../../services/federation/utils';

export type RoomRole = 'moderator' | 'owner' | 'leader';

interface IRoleConfig {
	role: RoomRole;
	permission: `set-${RoomRole}`;
	errorAlreadyHas: `error-user-already-${RoomRole}`;
	errorAlreadyHasMessage: string;
	supportsFederation: boolean;
}

const ROLE_CONFIGS: Record<RoomRole, IRoleConfig> = {
	moderator: {
		role: 'moderator',
		permission: 'set-moderator',
		errorAlreadyHas: 'error-user-already-moderator',
		errorAlreadyHasMessage: 'User is already a moderator',
		supportsFederation: true,
	},
	owner: {
		role: 'owner',
		permission: 'set-owner',
		errorAlreadyHas: 'error-user-already-owner',
		errorAlreadyHasMessage: 'User is already an owner',
		supportsFederation: true,
	},
	leader: {
		role: 'leader',
		permission: 'set-leader',
		errorAlreadyHas: 'error-user-already-leader',
		errorAlreadyHasMessage: 'User is already a leader',
		supportsFederation: false,
	},
};

/**
 * Unified helper function to add a role to a user in a room.
 *
 * This function consolidates the common logic from addRoomModerator, addRoomOwner,
 * and addRoomLeader, reducing code duplication and ensuring consistent behavior.
 *
 * @param fromUserId - The user ID of the person assigning the role
 * @param rid - The room ID where the role is being assigned
 * @param userId - The user ID of the person receiving the role
 * @param role - The role to assign ('moderator', 'owner', or 'leader')
 * @param methodName - The name of the calling method (for error messages)
 * @returns Promise<boolean> - true if the role was successfully assigned
 * @throws Meteor.Error for validation failures
 * @throws FederationMatrixInvalidConfigurationError for federation configuration issues
 */
export async function addRoomRole(
	fromUserId: IUser['_id'],
	rid: IRoom['_id'],
	userId: IUser['_id'],
	role: RoomRole,
	methodName: string,
): Promise<boolean> {
	check(rid, String);
	check(userId, String);

	const config = ROLE_CONFIGS[role];
	let room: IRoom | null = null;
	let isFederated = false;

	if (config.supportsFederation) {
		room = await Rooms.findOneById(rid, { projection: { t: 1, federated: 1, federation: 1 } });
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: methodName });
		}
		isFederated = isRoomFederated(room);
	}

	const hasPermission = await hasPermissionAsync(fromUserId, config.permission, rid);
	if (!hasPermission && !(config.supportsFederation && isFederated)) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: methodName });
	}

	if (config.supportsFederation && isFederated && !isFederationEnabled()) {
		throw new FederationMatrixInvalidConfigurationError('unable to change room roles');
	}

	const user = await Users.findOneById(userId);
	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: methodName });
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', { method: methodName });
	}

	if (subscription.roles && Array.isArray(subscription.roles) && subscription.roles.includes(role)) {
		throw new Meteor.Error(config.errorAlreadyHas, config.errorAlreadyHasMessage, { method: methodName });
	}

	if (room) {
		await beforeChangeRoomRole.run({ fromUserId, userId, room, role });
	}

	const fromUser = await Users.findOneById(fromUserId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: methodName });
	}

	const addRoleResponse = await Subscriptions.addRoleById(subscription._id, role);
	await syncRoomRolePriorityForUserAndRoom(userId, rid, subscription.roles?.concat([role]) || [role]);

	if (addRoleResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	await Message.saveSystemMessage('subscription-role-added', rid, user.username, fromUser, { role });

	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.addRolesToMember(team._id, userId, [role]);
	}

	const event = {
		type: 'added',
		_id: role,
		u: {
			_id: user._id,
			username: user.username,
			name: user.name,
		},
		scope: rid,
	} as const;

	if (settings.get<boolean>('UI_DisplayRoles')) {
		void api.broadcast('user.roleUpdate', event);
	}

	if (config.supportsFederation) {
		void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: fromUserId });
	}

	return true;
}
