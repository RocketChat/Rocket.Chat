import { Messages, Subscriptions, Rooms } from '../../../models';
import { callbacks } from '../../../callbacks';

export const deleteRoom = function(rid) {
	Messages.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	Subscriptions.removeByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
