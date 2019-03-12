import { Messages, Subscriptions, Rooms } from 'meteor/rocketchat:models';
import { callbacks } from 'meteor/rocketchat:callbacks';
export const deleteRoom = function(rid) {
	Messages.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	Subscriptions.removeByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
