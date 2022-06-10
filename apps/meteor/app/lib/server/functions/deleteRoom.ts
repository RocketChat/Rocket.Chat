import { DeleteWriteOpResultObject } from 'mongodb';
import { Meteor } from 'meteor/meteor';

import { Messages, Subscriptions, Rooms } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';
import { FileUpload } from '../../../file-upload/server';

export const deleteRoom = function (rid: string): Promise<DeleteWriteOpResultObject> {
	const [room] = Rooms.findById(rid).fetch();

	if (room.federated) {
		throw new Meteor.Error('error-cannot-delete-federated-room', 'Cannot delete federated room');
	}

	FileUpload.removeFilesByRoomId(rid);
	Messages.removeByRoomId(rid);
	callbacks.run('beforeDeleteRoom', rid);
	Subscriptions.removeByRoomId(rid);
	FileUpload.getStore('Avatars').deleteByRoomId(rid);
	callbacks.run('afterDeleteRoom', rid);
	return Rooms.removeById(rid);
};
