import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = function (rid: string): void {
	Promise.await(FileUpload.removeFilesByRoomId(rid));
	Promise.await(Messages.removeByRoomId(rid));
	callbacks.run('beforeDeleteRoom', rid);
	Promise.await(Subscriptions.removeByRoomId(rid));
	FileUpload.getStore('Avatars').deleteByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	Promise.await(Rooms.removeById(rid));
};
