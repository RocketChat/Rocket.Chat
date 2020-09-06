import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';
// import { Authorization } from '../../../../../server/sdk';

export const roomMessages = new Stream(STREAM_NAMES.ROOM_MESSAGES);
roomMessages.allowWrite('none');
roomMessages.allowRead(function(rid) {
	// TODO: missing method
	return this.client.broker.call('authorization.canAccessRoom', {
		room: { _id: rid },
		user: { _id: this.uid },
	});
});
