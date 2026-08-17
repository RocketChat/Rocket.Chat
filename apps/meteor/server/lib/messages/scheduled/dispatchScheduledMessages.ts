import type { IScheduledMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { ScheduledMessages, Users } from '@rocket.chat/models';

import { executeSendMessage } from '../../../meteor-methods/messages/sendMessage';
import { applyAirGappedRestrictionsValidation } from '../../cloud/license/airGappedRestrictionsWrapper';

const logger = new Logger('ScheduledMessages');

/**
 * A single dispatcher run must not spin forever: a large backlog is drained over several runs
 * instead of holding the cron slot.
 */
const MAX_MESSAGES_PER_RUN = 100;

/** A claim older than this belonged to an instance that died mid-delivery, so it is requeued. */
const STALE_CLAIM_MS = 5 * 60 * 1000;

const deliver = async (scheduledMessage: IScheduledMessage): Promise<void> => {
	const { _id, uid, rid, msg, tmid, tshow } = scheduledMessage;

	const user = await Users.findOneById(uid);
	if (!user?.username) {
		await ScheduledMessages.setAsFailed(_id, 'error-invalid-user');
		return;
	}

	const sent = await applyAirGappedRestrictionsValidation(() =>
		executeSendMessage(user, {
			rid,
			msg,
			...(tmid && { tmid }),
			...(tshow && { tshow }),
		}),
	);

	await ScheduledMessages.setAsSent(_id, sent._id);
};

/**
 * Delivers every scheduled message whose time has come. Claims are atomic, so running this on
 * several instances concurrently never delivers the same message twice.
 */
export async function dispatchScheduledMessages(now = new Date()): Promise<void> {
	await ScheduledMessages.requeueStale(new Date(now.getTime() - STALE_CLAIM_MS));

	for (let processed = 0; processed < MAX_MESSAGES_PER_RUN; processed++) {
		const scheduledMessage = await ScheduledMessages.claimNextDue(now);
		if (!scheduledMessage) {
			return;
		}

		try {
			await deliver(scheduledMessage);
		} catch (err: any) {
			logger.error({ msg: 'Failed to deliver scheduled message', scheduledMessageId: scheduledMessage._id, err });
			await ScheduledMessages.setAsFailed(scheduledMessage._id, err?.error || err?.message || 'error-unknown');
		}
	}
}
