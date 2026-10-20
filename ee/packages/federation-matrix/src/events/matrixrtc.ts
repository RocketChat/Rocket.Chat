import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';

import { handleMatrixRTCEvent } from '../matrixrtc/inbound';

const logger = new Logger('federation-matrix:matrixrtc');

export function matrixRTC() {
	federationSDK.eventEmitterService.on('homeserver.matrix.event', async (payload) => {
		try {
			await handleMatrixRTCEvent(payload);
		} catch (err) {
			logger.error({ msg: 'Failed to process a MatrixRTC event', eventId: payload.event_id, err });
		}
	});
}
