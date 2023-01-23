import type { IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelTranscript } from '@rocket.chat/core-services';

import { callbacks } from '../../../../../lib/callbacks';

type SendPdfTranscriptOnCloseParams = {
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

const sendPdfTranscriptOnClose = async (params: SendPdfTranscriptOnCloseParams): Promise<SendPdfTranscriptOnCloseParams> => {
	const { room, options } = params;

	if (!isOmnichannelRoom(room)) {
		return params;
	}

	const { pdfTranscript } = options;
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
