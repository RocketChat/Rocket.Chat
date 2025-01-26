import { OmnichannelTranscript, QueueWorker } from '@rocket.chat/core-services';
import type { AtLeast, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { logger } from './logger';

const serviceName = 'omnichannel-transcript' as const;
export const requestPdfTranscript = async (
	room: AtLeast<IOmnichannelRoom, '_id' | 'open' | 'v' | 'pdfTranscriptRequested'>,
	requestedBy: string,
): Promise<void> => {
	if (room.open) {
		throw new Error('room-still-open');
	}

	if (!room.v) {
		throw new Error('improper-room-state');
	}

	// Don't request a transcript if there's already one requested :)
	if (room.pdfTranscriptRequested) {
		// TODO: use logger
		logger.info(`Transcript already requested for room ${room._id}`);
		return;
	}

	// TODO: change this with a timestamp, allowing users to request a transcript again after a while if the first one fails
	await LivechatRooms.setTranscriptRequestedPdfById(room._id);

	const details = { details: { rid: room._id, userId: requestedBy, from: serviceName } };
	// Make the whole process sync when running on test mode
	// This will prevent the usage of timeouts on the tests of this functionality :)
	if (process.env.TEST_MODE) {
		await OmnichannelTranscript.workOnPdf(details);
		return;
	}

	logger.info(`Queuing work for room ${room._id}`);
	await QueueWorker.queueWork('work', `${serviceName}.workOnPdf`, details);
};
