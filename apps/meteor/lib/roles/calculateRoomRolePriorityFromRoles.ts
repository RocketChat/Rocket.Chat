import type { IRole } from '@rocket.chat/core-typings';
import { ROOM_ROLE_PRIORITY_MAP } from '@rocket.chat/core-typings';

/**
 * Retrieves the role priority for a given role.
 * @param role The role ID.
 * @returns The priority of the role.
 */
export const getRoomRolePriorityForRole = (role: IRole['_id']): number =>
	ROOM_ROLE_PRIORITY_MAP[role as keyof typeof ROOM_ROLE_PRIORITY_MAP] ?? ROOM_ROLE_PRIORITY_MAP.default;

/**
 * Calculates the minimum role priority from a list of roles.
 * @param roles The array of role IDs.
 * @returns The minimum role priority.
 */
export const calculateRoomRolePriorityFromRoles = (roles: IRole['_id'][]): number =>
	roles.reduce((currentMin, role) => Math.min(currentMin, getRoomRolePriorityForRole(role)), ROOM_ROLE_PRIORITY_MAP.default);
