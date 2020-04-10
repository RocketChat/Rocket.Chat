import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../../app/utils';
import { ROOM_DATA_STREAM } from '../../../app/utils/stream/constants';

export const roomDataStream = new Meteor.Streamer(ROOM_DATA_STREAM);

roomDataStream.allowWrite('none');

roomDataStream.allowRead(function(rid) {
	try {
		const room = Meteor.call('canAccessRoom', rid, this.userId);
		if (!room) {
			return false;
		}

		return roomTypes.getConfig(room.t).isEmitAllowed();
	} catch (error) {
		return false;
	}
});

export function emitRoomDataEvent(id, data) {
	if (!data || !data.t) {
		return;
	}

	if (!roomTypes.getConfig(data.t).isEmitAllowed()) {
		return;
	}

	roomDataStream.emitWithoutBroadcast(id, data);
}
