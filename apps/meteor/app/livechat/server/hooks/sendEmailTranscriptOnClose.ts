import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/LivechatTyped';
import type { CloseRoomParams } from '../lib/LivechatTyped';

type LivechatCloseCallbackParams = {
	room: IOmnichannelRoom;
	options: CloseRoomParams['options'];
};

const sendEmailTranscriptOnClose = async (params: LivechatCloseCallbackParams): Promise<LivechatCloseCallbackParams> => {
	const { room, options } = params;

	if (!isOmnichannelRoom(room)) {
		return params;
	}

	const { _id: rid, v: { token } = {} } = room;
	if (!token) {
		return params;
	}

	const transcriptData = resolveTranscriptData(room, options);
	if (!transcriptData) {
		return params;
	}

	const { email, subject, requestedBy: user } = transcriptData;

	await Promise.all([
		Livechat.sendTranscript({ token, rid, email, subject, user }),
		LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid),
	]);

	delete room.transcriptRequest;

	return {
		room,
		options,
	};
};

const resolveTranscriptData = (
	room: IOmnichannelRoom,
	options: LivechatCloseCallbackParams['options'] = {},
): IOmnichannelRoom['transcriptRequest'] | undefined => {
	const { transcriptRequest: roomTranscriptRequest } = room;

	const { emailTranscript: optionsTranscriptRequest } = options;

	// Note: options.emailTranscript will override the room.transcriptRequest check
	// If options.emailTranscript is not set, then the room.transcriptRequest will be checked
	if (optionsTranscriptRequest === undefined) {
		return roomTranscriptRequest;
	}

	if (!optionsTranscriptRequest.sendToVisitor) {
		return undefined;
	}
	return optionsTranscriptRequest.requestData;
};

callbacks.add('livechat.closeRoom', sendEmailTranscriptOnClose, callbacks.priority.HIGH, 'livechat-send-email-transcript-on-close-room');
