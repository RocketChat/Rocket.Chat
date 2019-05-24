import { Messages, Subscriptions, Rooms } from '../../../models';
import { callbacks } from '../../../callbacks';
import { FileUpload } from '../../../file-upload';

export const deleteRoom = function(rid) {
	const room = Rooms.findOneById(rid);

	Messages.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	Subscriptions.removeByRoomId(rid);

	// removes room's avatar
	if (room.avatarOrigin === 'upload' || room.avatarOrigin === 'url') {
		FileUpload.getStore('Avatars').deleteByName(room._id);
	}

	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
