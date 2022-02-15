import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { LivechatRooms } from '../../../models/server/index';
import { IRoom, isOmnichannelRoom } from '../../../../definition/IRoom';

const sendTranscriptOnClose = (room: IRoom): IRoom => {
	// do nothing if room is not omnichannel room
	if (!isOmnichannelRoom(room)) {
		return room;
	}

	const { _id: rid, transcriptRequest, v: { token } = {} } = room;
	if (!transcriptRequest || !token) {
		return room;
	}

	const { email, subject, requestedBy: user } = transcriptRequest;
	Livechat.sendTranscript({ token, rid, email, subject, user });

	LivechatRooms.removeTranscriptRequestByRoomId(rid);

	return LivechatRooms.findOneById(rid);
};

callbacks.add('livechat.closeRoom', sendTranscriptOnClose, callbacks.priority.HIGH, 'livechat-send-transcript-on-close-room');
