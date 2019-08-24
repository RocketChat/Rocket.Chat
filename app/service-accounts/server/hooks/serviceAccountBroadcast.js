import { callbacks } from '../../../callbacks/server';
import { sendBroadcastMessage } from '../functions/sendBroadcastMessage';

callbacks.add('beforeSaveMessage', (message, room) => {
	// abort if room is not with a service account broadcast room
	if (!room || !room.sa) {
		return message;
	}
	sendBroadcastMessage(message);
	return message;
});
