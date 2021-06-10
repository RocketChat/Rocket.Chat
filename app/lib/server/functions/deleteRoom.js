import { Messages, Subscriptions, Rooms } from '../../../models';
import { callbacks } from '../../../callbacks';
import { FileUpload } from '../../../../server/services/file-handling/file-upload';

export const deleteRoom = function(rid) {
	FileUpload.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	callbacks.run('beforeDeleteRoom', rid);
	Subscriptions.removeByRoomId(rid);
	FileUpload.getStore('Avatars').deleteByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
