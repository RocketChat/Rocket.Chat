import { ChangeEvent } from 'mongodb';

import { normalize } from './utils';
import { api } from '../../../../server/sdk/api';
import { IRoom } from '../../../../definition/IRoom';

export async function watchRooms(event: ChangeEvent<IRoom>): Promise<void> {
	let room;
	switch (event.operationType) {
		case 'insert':
		case 'update':
			// room = await Rooms.findOne(documentKey/* , { fields }*/);
			room = event.fullDocument;
			break;
		case 'delete':
			room = event.documentKey;
			break;
		default:
			return;
	}
	// console.log(room, documentKey);
	if (!room) {
		return;
	}
	api.broadcast('room', { action: normalize[event.operationType], room });
	// RocketChat.Notifications.streamUser.__emit(data._id, operationType, data);
	// RocketChat.Logger.info('Rooms record', room);
}
