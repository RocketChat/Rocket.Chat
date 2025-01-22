import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import type { CloseRoomParams } from '../../../../../app/livechat/server/lib/localTypes';
import { callbacks } from '../../../../../lib/callbacks';
import { requestPdfTranscript } from '../lib/requestPdfTranscript';

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

	await requestPdfTranscript(room, requestedBy);

	return params;
};

callbacks.add('livechat.closeRoom', sendPdfTranscriptOnClose, callbacks.priority.HIGH, 'livechat-send-pdf-transcript-on-close-room');
