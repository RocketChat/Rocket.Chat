import { VideoConf } from '@rocket.chat/core-services';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';

import type { Pexip } from '../Pexip';
import type { EventSinkRequest } from '../definition';
import { logger } from '../logger';

export class EventSinkEndpoint {
	constructor(public readonly pexip: Pexip) {
		//
	}

	public async post(event: EventSinkRequest): Promise<void> {
		if (event.event !== 'conference_ended') {
			return;
		}

		try {
			await VideoConf.setStatus(event.data.name, VideoConferenceStatus.ENDED);
		} catch (err) {
			logger.error({ msg: 'Failed to flag conference as ended', err });
			// If the call was not found or we were unable to change the status, we must have received an alias instead of a callId and there's nothing we can do with it, so ignore any errors.
		}
	}
}
