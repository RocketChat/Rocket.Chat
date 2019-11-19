import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../../app/utils';
import { ROOM_DATA_STREAM_OBSERVER } from '../../../app/utils/stream/constants';

export const roomDataStream = new Meteor.Streamer(ROOM_DATA_STREAM_OBSERVER);

const isEmitAllowed = (t) => roomTypes.getConfig(t).listenStreamerEvents();

roomDataStream.allowWrite('none');

roomDataStream.allowRead(function(rid) {
	try {
		const room = Meteor.call('canAccessRoom', rid, this.userId);

		if (!room) {
			return false;
		}

		if (isEmitAllowed(room.t) === false) {
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
});

export function emitRoomDataEvent(id, data) {
	if (!data) {
		return;
	}

	if (isEmitAllowed(data.t) === false) {
		return;
	}

	roomDataStream.emit(id, data);
}
