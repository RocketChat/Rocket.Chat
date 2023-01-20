import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';

type SendEmailTranscriptOnCloseParams = {
	room: IRoom;
	options: { clientAction?: boolean; tags: string[]; sendTranscriptEmailToVisitor?: boolean; generateTranscriptPdf?: boolean };
};

const sendEmailTranscriptOnClose = async (params: SendEmailTranscriptOnCloseParams): Promise<SendEmailTranscriptOnCloseParams> => {
	const {
		room,
		options: { sendTranscriptEmailToVisitor },
	} = params;

	if (!isOmnichannelRoom(room)) {
		return params;
	}

	const { _id: rid, transcriptRequest, v: { token } = {} } = room;
	if (!token) {
		return params;
	}

	// Note: options.sendTranscriptEmailToVisitor will override the room.transcriptRequest check
	// If options.sendTranscriptEmailToVisitor is not set, then the room.transcriptRequest will be checked
	if (sendEmailTranscriptOnClose === undefined) {
		if (!transcriptRequest) {
			return params;
		}
	} else if (!sendTranscriptEmailToVisitor) {
		return params;
	} else if (!transcriptRequest) {
		// TODO: Not sure what to do about this case yet
		// need to figure out how to get the email address from the visitor
		// need to check with design team
		return params;
	}

	const { email, subject, requestedBy: user } = transcriptRequest;

	await Promise.all([
		Livechat.sendTranscript({ token, rid, email, subject, user }),
		LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid),
	]);

	delete room.transcriptRequest;

	return {
		room,
		options: params.options,
	};
};

callbacks.add(
	'livechat.closeRoom',
	Promise.await(sendEmailTranscriptOnClose),
	callbacks.priority.HIGH,
	'livechat-send-email-transcript-on-close-room',
);
