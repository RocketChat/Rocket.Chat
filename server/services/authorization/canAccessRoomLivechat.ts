import { IAuthorizationLivechat } from '../../sdk/types/IAuthorizationLivechat';
import { proxifyWithWait } from '../../sdk/lib/proxify';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';

export const AuthorizationLivechat = proxifyWithWait<IAuthorizationLivechat>('authorization-livechat');

export const canAccessRoomLivechat: RoomAccessValidator = async (room, user): Promise<boolean> => {
	if (room.t !== 'l') {
		return false;
	}

	// Call back core temporarily
	return AuthorizationLivechat.canAccessRoom(room, user);
};
