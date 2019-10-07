import { LivechatRooms } from '../../../../models/server/raw';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

export async function findRoomById({ userId, roomId }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-manager')) {
		throw new Error('error-not-authorized');
	}

	return {
		room: await LivechatRooms.findOneById(roomId),
	};
}
