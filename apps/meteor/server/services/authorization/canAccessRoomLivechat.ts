import type { IAuthorizationLivechat, RoomAccessValidator } from '@rocket.chat/core-services';
import { proxify } from '@rocket.chat/core-services';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

const AuthorizationLivechat = proxify<IAuthorizationLivechat>('authorization-livechat');

export const canAccessRoomLivechat: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// If we received a partial room and its type is not `l` or `v`, skip all checks.
	if (room && !['v', 'l'].includes(room.t)) {
		return false;
	}

	// if we received a partial room, load the full IOmnichannelRoom data for it
	// Otherwise, try to load the data from the extraData (this is the case for file uploads)
	const rid = room?._id || extraData?.rid;
	const livechatRoom = rid && (await Rooms.findOneById(rid));

	// if the roomId is invalid skip checks and fail
	if (!livechatRoom) {
		return false;
	}

	// Check the type again in case the room parameter was not received
	if (!['v', 'l'].includes(livechatRoom.t)) {
		return false;
	}

	// Call back core temporarily
	return AuthorizationLivechat.canAccessRoom(livechatRoom as IOmnichannelRoom, user, extraData);
};
