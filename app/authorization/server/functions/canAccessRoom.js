import { Authorization } from '../../../../server/sdk';

export const canAccessRoomAsync = async (room, user, extraData) => Authorization.hasAllPermission(room, user, extraData);

export const canAccessRoom = (room, user, extraData) => Promise.await(canAccessRoomAsync(room, user, extraData));
