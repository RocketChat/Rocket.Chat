import { Messages, Subscriptions, Rooms } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = async function (rid: string): Promise<void> {
	FileUpload.removeFilesByRoomId(rid);
	await Messages.removeByRoomId(rid);
	callbacks.run('beforeDeleteRoom', rid);
	Subscriptions.removeByRoomId(rid);
	FileUpload.getStore('Avatars').deleteByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	Rooms.removeById(rid);
};
