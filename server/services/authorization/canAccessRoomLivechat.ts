import { IAuthorizationLivechat } from '../../sdk/types/IAuthorizationLivechat';
import { proxifyWithWait } from '../../sdk/lib/proxify';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { LivechatRooms } from '../../../app/models/server/raw';

export const AuthorizationLivechat = proxifyWithWait<IAuthorizationLivechat>('authorization-livechat');

export const canAccessRoomLivechat: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// If we received a partial room and its type is not `l`, skip all checks.
	if (room && room.t !== 'l') {
		return false;
	}

	// if we received a partial room, load the full IOmnichannelRoom data for it
	// Otherwise, try to load the data from the extraData (this is the case for file uploads)
	const rid = room?._id || extraData?.rid;
	const livechatRoom = rid && await LivechatRooms.findOneById(rid);

	// Check the type again in case the room parameter was not received
	if (livechatRoom?.t !== 'l') {
		return false;
	}

	// Call back core temporarily
	return AuthorizationLivechat.canAccessRoom(livechatRoom, user, extraData);
};
