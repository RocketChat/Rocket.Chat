import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';
import { Authorization } from '../../../../../server/sdk';

export const roomMessages = new Stream(STREAM_NAMES.ROOM_MESSAGES);
roomMessages.allowWrite('none');
roomMessages.allowRead(function(rid) {
	return Authorization.canAccessRoom({ _id: rid }, { _id: this.uid });
});
