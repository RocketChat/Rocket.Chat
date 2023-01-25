import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelTranscript } from '@rocket.chat/core-services';

import { callbacks } from '../../../../../lib/callbacks';
import type { CloseRoomParams } from '../../../../../app/livechat/server/lib/LivechatTyped.d';

type SendPdfTranscriptOnCloseParams = {
	room: IRoom;
	options: CloseRoomParams['options'];
};

const sendPdfTranscriptOnClose = async (params: SendPdfTranscriptOnCloseParams): Promise<SendPdfTranscriptOnCloseParams> => {
	const { room, options } = params;

	if (!isOmnichannelRoom(room)) {
		return params;
	}

	const { pdfTranscript } = options || {};
	if (!pdfTranscript) {
		return params;
	}

	const { requestedBy } = pdfTranscript;

	await OmnichannelTranscript.requestTranscript({
		details: {
			userId: requestedBy,
			rid: room._id,
		},
	});

	return {
		room,
		options: params.options,
	};
};

callbacks.add(
	'livechat.closeRoom',
	Promise.await(sendPdfTranscriptOnClose),
	callbacks.priority.HIGH,
	'livechat-send-pdf-transcript-on-close-room',
);
