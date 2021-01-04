import { IAuthorizationLivechat } from '../../sdk/types/IAuthorizationLivechat';
import { proxifyWithWait } from '../../sdk/lib/proxify';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { Rooms } from './service';

export const AuthorizationLivechat = proxifyWithWait<IAuthorizationLivechat>('authorization-livechat');

export const canAccessRoomLivechat: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// room can be sent as `null` but in that case a `rid` is also sent on extraData
	// this is the case for file uploads
	const livechatRoom = room || (extraData?.rid && await Rooms.findOneById(extraData?.rid));
	if (livechatRoom?.t !== 'l') {
		return false;
	}

	// Call back core temporarily
	return AuthorizationLivechat.canAccessRoom(livechatRoom, user, extraData);
};
