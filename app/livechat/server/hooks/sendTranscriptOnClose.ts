import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { LivechatRooms } from '../../../models/server/index';

type RoomData = { _id: string; transcriptRequest: any; v: { token: string } };

const sendTranscriptOnClose = (room: RoomData): RoomData => {
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
