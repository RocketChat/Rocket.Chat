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

/**
 * Supported room roles that can be assigned via this helper
 */
export type RoomRole = 'moderator' | 'owner' | 'leader';

/**
 * Configuration for a specific room role operation
 */
interface IRoleConfig {
	/** The role being assigned */
	role: RoomRole;
	/** The permission required to assign this role */
	permission: `set-${RoomRole}`;
	/** Error code when user already has this role */
	errorAlreadyHas: `error-user-already-${RoomRole}`;
	/** Human-readable error message */
	errorAlreadyHasMessage: string;
	/**
	 * Whether this role supports federation features.
	 * When true:
	 * - Validates federation configuration for federated rooms
	 * - Allows assignment in federated rooms even without local permission
	 * - Broadcasts federation.userRoleChanged event
	 */
	supportsFederation: boolean;
}

/**
 * Role configurations for each supported room role
 */
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

	// For roles that support federation, we need to fetch and check room federation status
	if (config.supportsFederation) {
		room = await Rooms.findOneById(rid, { projection: { t: 1, federated: 1, federation: 1 } });
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: methodName });
		}
		isFederated = isRoomFederated(room);
	}

	// Check permission - federated rooms may bypass local permission check
	const hasPermission = await hasPermissionAsync(fromUserId, config.permission, rid);
	if (!hasPermission && !(config.supportsFederation && isFederated)) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: methodName });
	}

	// Validate federation configuration for federated rooms
	if (config.supportsFederation && isFederated && !isFederationEnabled()) {
		throw new FederationMatrixInvalidConfigurationError('unable to change room roles');
	}

	// Fetch target user
	const user = await Users.findOneById(userId);
	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: methodName });
	}

	// Verify user is in the room
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (!subscription) {
		throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', { method: methodName });
	}

	// Check if user already has this role
	if (subscription.roles && Array.isArray(subscription.roles) && subscription.roles.includes(role)) {
		throw new Meteor.Error(config.errorAlreadyHas, config.errorAlreadyHasMessage, { method: methodName });
	}

	// Run before-change callback for roles that support federation (need room object)
	// The callback supports all roles including 'leader', so we run it for all roles when we have the room
	if (room) {
		await beforeChangeRoomRole.run({ fromUserId, userId, room, role });
	}

	// Add the role to the subscription
	const addRoleResponse = await Subscriptions.addRoleById(subscription._id, role);
	await syncRoomRolePriorityForUserAndRoom(userId, rid, subscription.roles?.concat([role]) || [role]);

	// Notify subscription change
	if (addRoleResponse.modifiedCount) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	// Fetch the user who is granting the role (for system message)
	const fromUser = await Users.findOneById(fromUserId);
	if (!fromUser) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: methodName });
	}

	// Save system message
	await Message.saveSystemMessage('subscription-role-added', rid, user.username, fromUser, { role });

	// Add role to team if this room is a team's main room
	const team = await Team.getOneByMainRoomId(rid);
	if (team) {
		await Team.addRolesToMember(team._id, userId, [role]);
	}

	// Broadcast role update event
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

	// Broadcast federation event for federation-enabled roles
	if (config.supportsFederation) {
		void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: fromUserId });
	}

	return true;
}
