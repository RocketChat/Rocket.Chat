import { IAuthorizationTokenpass } from '../../sdk/types/IAuthorizationTokenpass';
import { proxify } from '../../sdk/lib/proxify';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';

export const AuthorizationTokenpass = proxify<IAuthorizationTokenpass>('authorization.tokenpass');

export const canAccessRoomTokenpass: RoomAccessValidator = async (room, user): Promise<boolean> => {
	if (!room.tokenpass) {
		return false;
	}

	// Call back core temporarily
	return AuthorizationTokenpass.canAccessRoom(room, user);
};
