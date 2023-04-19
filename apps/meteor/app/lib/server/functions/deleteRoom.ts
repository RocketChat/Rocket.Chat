import { Messages, Rooms, Subscriptions, ReadReceipts } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = async function (rid: string): Promise<void> {
	await FileUpload.removeFilesByRoomId(rid);
	await Messages.removeByRoomId(rid);
	await ReadReceipts.removeByRoomId(rid);
	await callbacks.run('beforeDeleteRoom', rid);
	await Subscriptions.removeByRoomId(rid);
	await FileUpload.getStore('Avatars').deleteByRoomId(rid);
	await callbacks.run('afterDeleteRoom', rid);
	await Rooms.removeById(rid);
};
