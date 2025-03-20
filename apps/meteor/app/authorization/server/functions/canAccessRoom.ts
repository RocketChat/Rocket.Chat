import { Authorization } from '@rocket.chat/core-services';

export const canAccessRoomAsync = Authorization.canAccessRoom;
export const canAccessRoomIdAsync = Authorization.canAccessRoomId;
export const roomAccessAttributes = {
	_id: 1,
	t: 1,
	teamId: 1,
	prid: 1,
};
