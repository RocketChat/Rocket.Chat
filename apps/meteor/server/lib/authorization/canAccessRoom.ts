import { Authorization } from '@rocket.chat/core-services';

/**
 * @deprecated Use `Authorization.canAccessRoom` from `@rocket.chat/core-services` directly instead.
 */
export const canAccessRoomAsync = Authorization.canAccessRoom;

/**
 * @deprecated Use `Authorization.canAccessRoomId` from `@rocket.chat/core-services` directly instead.
 */
export const canAccessRoomIdAsync = Authorization.canAccessRoomId;

/**
 * @deprecated Use `Authorization.canAccessRoomIds` from `@rocket.chat/core-services` directly instead.
 */
export const canAccessRoomIdsAsync = Authorization.canAccessRoomIds;

export const roomAccessAttributes = {
	_id: 1,
	t: 1,
	teamId: 1,
	prid: 1,
	abacAttributes: 1,
};

