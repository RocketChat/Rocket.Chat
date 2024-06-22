import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnRoomChangedById, notifyOnSubscriptionChangedByRoomId } from '../lib/notifyListener';

export const deleteRoom = async function (rid: string): Promise<void> {
	await FileUpload.removeFilesByRoomId(rid);

	await Messages.removeByRoomId(rid);

	await callbacks.run('beforeDeleteRoom', rid);

	(await Subscriptions.removeByRoomId(rid)).deletedCount && void notifyOnSubscriptionChangedByRoomId(rid, 'removed');

	await FileUpload.getStore('Avatars').deleteByRoomId(rid);

	await callbacks.run('afterDeleteRoom', rid);

	(await Rooms.removeById(rid)).deletedCount && void notifyOnRoomChangedById(rid, 'removed');
};
