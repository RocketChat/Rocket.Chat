import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../../app/utils';
import notifications from '../../../app/notifications/server/lib/Notifications';

notifications.streamRoomData.allowRead(function(rid) {
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

	notifications.streamRoomData.emitWithoutBroadcast(id, data);
}
