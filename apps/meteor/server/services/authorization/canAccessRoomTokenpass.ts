import { IAuthorizationTokenpass } from '../../sdk/types/IAuthorizationTokenpass';
import { proxifyWithWait } from '../../sdk/lib/proxify';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';

export const AuthorizationTokenpass = proxifyWithWait<IAuthorizationTokenpass>('authorization-tokenpass');

export const canAccessRoomTokenpass: RoomAccessValidator = async (room, user): Promise<boolean> => {
	if (!room?.tokenpass) {
		return false;
	}

	// Call back core temporarily
	return AuthorizationTokenpass.canAccessRoom(room, user);
};
