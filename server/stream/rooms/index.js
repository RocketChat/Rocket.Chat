import { roomTypes } from '../../../app/utils';
import notifications from '../../../app/notifications/server/lib/Notifications';

export function emitRoomDataEvent(id, data) {
	if (!data || !data.t) {
		return;
	}

	if (!roomTypes.getConfig(data.t).isEmitAllowed()) {
		return;
	}

	notifications.streamRoomData.emitWithoutBroadcast(id, data);
}
