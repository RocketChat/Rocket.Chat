import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

export const deleteRoom = async function (rid: string): Promise<void> {
	await FileUpload.removeFilesByRoomId(rid);

	await Messages.removeByRoomId(rid);

	await callbacks.run('beforeDeleteRoom', rid);

	await Subscriptions.removeByRoomId(rid, {
		async onTrash(doc) {
			void notifyOnSubscriptionChanged(doc, 'removed');
		},
	});

	await FileUpload.getStore('Avatars').deleteByRoomId(rid);

	await callbacks.run('afterDeleteRoom', rid);

	const { deletedCount } = await Rooms.removeById(rid);
	if (deletedCount) {
		void notifyOnRoomChangedById(rid, 'removed');
	}
};
