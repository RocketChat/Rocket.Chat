import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../server/lib/callbacks';
import type { CloseRoomParams } from '../../../../server/lib/omnichannel/localTypes';
import { requestPdfTranscript } from '../../lib/omnichannel/requestPdfTranscript';

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
