import type { IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';

type SendEmailTranscriptOnCloseParams = {
	room: IRoom;
	options: {
		clientAction?: boolean;
		tags: string[];
		emailTranscript?:
			| {
					sendToVisitor: false;
			  }
			| {
					sendToVisitor: true;
					requestData: NonNullable<IOmnichannelRoom['transcriptRequest']>;
			  };
		pdfTranscript?: {
			requestedBy: string;
		};
	};
};

const sendEmailTranscriptOnClose = async (params: SendEmailTranscriptOnCloseParams): Promise<SendEmailTranscriptOnCloseParams> => {
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
	options: SendEmailTranscriptOnCloseParams['options'],
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

callbacks.add(
	'livechat.closeRoom',
	Promise.await(sendEmailTranscriptOnClose),
	callbacks.priority.HIGH,
	'livechat-send-email-transcript-on-close-room',
);
