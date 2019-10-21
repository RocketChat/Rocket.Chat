import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { Messages, LivechatRooms } from '../../../../models/server/raw';

export async function findVisitedPages({ userId, roomId }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	return {
		pages: await Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history').toArray(),
	};
}
