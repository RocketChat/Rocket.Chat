import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { beforeSendMessageToRoom } from '../../../../server/hooks/rooms/beforeSendMessageToRoom';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';

beforeSendMessageToRoom.patch(async (prev, room) => {
	await prev(room);

	if (isRoomAbacLocked(room, getRoomAbacLockContext())) {
		throw new Error('error-abac-room-locked');
	}
});
