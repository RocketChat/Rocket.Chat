import { DeleteWriteOpResultObject } from 'mongodb';

import { Messages, Subscriptions, Rooms } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = function (rid: string): Promise<DeleteWriteOpResultObject> {
	FileUpload.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	callbacks.run('beforeDeleteRoom', rid);
	Subscriptions.removeByRoomId(rid);
	FileUpload.getStore('Avatars').deleteByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
