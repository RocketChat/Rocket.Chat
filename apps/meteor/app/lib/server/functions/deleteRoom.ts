import { Meteor } from 'meteor/meteor';
import { MedsenseRequests, Messages, Rooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnRoomChangedById, notifyOnSubscriptionChanged } from '../lib/notifyListener';

export const deleteRoom = async function (rid: string): Promise<void> {
	const activeRequest = await MedsenseRequests.findActiveByRoomId(rid);
	if (activeRequest) {
		throw new Meteor.Error(
			'error-room-has-active-request',
			'Cannot delete a room with an active Medsense request. Close the request first.',
		);
	}

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
