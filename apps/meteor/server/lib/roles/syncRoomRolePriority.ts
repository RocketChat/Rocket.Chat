import type { IRole, IRoom, IUser } from '@rocket.chat/core-typings';
import { ROOM_ROLE_PRIORITY_MAP } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';

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

/**
 * Updates the room role priority for a user in a given room.
 * If roles are provided, it uses them directly; otherwise, it fetches the subscription for the user and room.
 * @param userId The user's ID.
 * @param rid The room's ID.
 * @param roles Optional roles array. If not provided, the roles will be fetched.
 */
export const syncRoomRolePriorityForUserAndRoom = async (
	userId: IUser['_id'],
	rid: IRoom['_id'],
	roles?: IRole['_id'][],
): Promise<void> => {
	const updateRolePriority = async (userId: IUser['_id'], rid: IRoom['_id'], roles: IRole['_id'][]): Promise<void> => {
		const rolePriority = calculateRoomRolePriorityFromRoles(roles);
		await Users.addRoomRolePriorityByUserId(userId, rid, rolePriority);
	};

	if (roles) {
		return updateRolePriority(userId, rid, roles);
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, {
		projection: { roles: 1, u: 1, rid: 1 },
	});

	if (!subscription?.roles) {
		return;
	}

	return updateRolePriority(subscription.u._id, subscription.rid, subscription.roles);
};
