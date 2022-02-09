import { IAuthorizationLivechat } from '../../sdk/types/IAuthorizationLivechat';
import { proxifyWithWait } from '../../sdk/lib/proxify';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { Rooms } from './service';

export const AuthorizationLivechat = proxifyWithWait<IAuthorizationLivechat>('authorization-livechat');

export const canAccessRoomLivechat: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// room can be sent as `null` but in that case a `rid` is also sent on extraData
	// this is the case for file uploads
	const foundRoom = room || (extraData?.rid && (await Rooms.findOneById(extraData?.rid)));

	if (!foundRoom || !foundRoom.t) {
		return false;
	}

	if (!['v', 't'].includes(foundRoom.t)) {
		return false;
	}

	// Call back core temporarily
	return AuthorizationLivechat.canAccessRoom(room, user, extraData);
};
