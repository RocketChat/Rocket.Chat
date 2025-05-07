import { OmnichannelTranscript, QueueWorker } from '@rocket.chat/core-services';
import type { AtLeast, IOmnichannelRoom } from '@rocket.chat/core-typings';
import ExpiryMap from 'expiry-map';

import { logger } from './logger';

// Allow to request a transcript again after 15 seconds, assuming the first one didn't complete
// This won't prevent multiple transcript generated for the same room in a multi-instance deployment since state is not shared, but we're ok with the drawbacks
const LockMap = new ExpiryMap<string, boolean>(15000);

const serviceName = 'omnichannel-transcript' as const;
export const requestPdfTranscript = async (
	room: AtLeast<IOmnichannelRoom, '_id' | 'open' | 'v' | 'pdfTranscriptFileId'>,
	requestedBy: string,
): Promise<void> => {
	if (room.open) {
		throw new Error('room-still-open');
	}

	if (!room.v) {
		throw new Error('improper-room-state');
	}

	// Don't request a transcript if there's already one requested
	if (LockMap.has(room._id) || room.pdfTranscriptFileId) {
		// TODO: use logger
		logger.info({ msg: `Transcript already requested`, roomId: room._id });
		return;
	}

	LockMap.set(room._id, true);

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
