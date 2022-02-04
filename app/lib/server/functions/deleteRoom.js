import { Messages, Subscriptions, Rooms } from '../../../models';
import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = function (rid) {
	FileUpload.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	callbacks.run('beforeDeleteRoom', rid);
	Subscriptions.removeByRoomId(rid);
	FileUpload.getStore('Avatars').deleteByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
