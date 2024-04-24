import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';
import { api, dbWatchersDisabled } from '@rocket.chat/core-services';

import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = async function (rid: string): Promise<void> {
	await FileUpload.removeFilesByRoomId(rid);
	await Messages.removeByRoomId(rid);
	await callbacks.run('beforeDeleteRoom', rid);
	await Subscriptions.removeByRoomId(rid);
	await FileUpload.getStore('Avatars').deleteByRoomId(rid);
	await callbacks.run('afterDeleteRoom', rid);
	await Rooms.removeById(rid);

	if (dbWatchersDisabled) {
		const room = await Rooms.findById(rid);
		if (room) {
			void api.broadcast('watch.rooms', {
				clientAction: 'removed',
				room,
			})
		}
	}
};
