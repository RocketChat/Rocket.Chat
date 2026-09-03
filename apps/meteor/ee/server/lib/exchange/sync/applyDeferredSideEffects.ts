import { Calendar } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';

import { logger } from '../logger';
import { scrubForLog } from '../scrub';

export const applyDeferredSideEffects = async (dirty: Map<IUser['_id'], boolean>): Promise<void> => {
	for (const [uid, endedInProgressEvent] of dirty) {
		try {
			await Calendar.refreshBusyPresence(uid, { endedInProgressEvent });
		} catch (err) {
			// One user's presence write must not cost the rest of the run theirs, nor the reschedule below.
			logger.error({ msg: 'Could not refresh calendar busy presence after the Exchange sync', uid, err: scrubForLog(err) });
		}
	}

	if (!dirty.size) {
		return;
	}

	try {
		await Calendar.setupNextNotification();
		await Calendar.setupNextStatusChange();
	} catch (err) {
		logger.error({ msg: 'Could not reschedule calendar jobs after the Exchange sync', err: scrubForLog(err) });
	}
};
