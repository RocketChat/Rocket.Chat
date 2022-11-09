import { Rooms } from '@rocket.chat/models';

import type { IAuthorizationVoip } from '../../sdk/types/IAuthorizationVoip';
import { proxifyWithWait } from '../../sdk/lib/proxify';
import type { RoomAccessValidator } from '../../sdk/types/IAuthorization';

export const AuthorizationVoip = proxifyWithWait<IAuthorizationVoip>('authorization-livechat');

export const canAccessRoomVoip: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
	// room can be sent as `null` but in that case a `rid` is also sent on extraData
	// this is the case for file uploads
	const voipRoom = room || (extraData?.rid && (await Rooms.findOneById(extraData?.rid)));

	if (voipRoom?.t !== 'v') {
		return false;
	}

	// Call back core temporarily
	return AuthorizationVoip.canAccessRoom(voipRoom, user, extraData);
};
