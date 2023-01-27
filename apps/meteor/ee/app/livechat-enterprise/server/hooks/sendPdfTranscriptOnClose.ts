import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelTranscript } from '@rocket.chat/core-services';

import { callbacks } from '../../../../../lib/callbacks';
import type { CloseRoomParams } from '../../../../../app/livechat/server/lib/LivechatTyped.d';

type LivechatCloseCallbackParams = {
	room: IOmnichannelRoom;
	options: CloseRoomParams['options'];
};

const sendPdfTranscriptOnClose = async (params: LivechatCloseCallbackParams): Promise<LivechatCloseCallbackParams> => {
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

	return params;
};

callbacks.add(
	'livechat.closeRoom',
	Promise.await(sendPdfTranscriptOnClose),
	callbacks.priority.HIGH,
	'livechat-send-pdf-transcript-on-close-room',
);
