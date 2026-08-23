import type { IScheduledMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { ScheduledMessages, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

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

/**
 * The delivered message reuses the scheduled message's `_id`, which makes delivery idempotent: if a
 * stale claim was requeued while the original instance was still sending, the second attempt collides
 * with the message already in the collection instead of posting it twice.
 */
const deliveredMessageId = (scheduledMessage: IScheduledMessage): string => scheduledMessage._id;

const deliver = async (scheduledMessage: IScheduledMessage, claimId: string): Promise<void> => {
	const { _id, uid, rid, msg, tmid, tshow } = scheduledMessage;

	const user = await Users.findOneById(uid);
	if (!user?.username) {
		await ScheduledMessages.setAsFailed(_id, claimId, 'error-invalid-user');
		return;
	}

	await applyAirGappedRestrictionsValidation(() =>
		executeSendMessage(user, {
			_id: deliveredMessageId(scheduledMessage),
			rid,
			msg,
			...(tmid && { tmid }),
			...(tshow && { tshow }),
		}),
	);

	// a lost claim means another instance took the message over; whatever it decides wins
	if (!(await ScheduledMessages.setAsSent(_id, claimId, deliveredMessageId(scheduledMessage)))) {
		logger.warn({ msg: 'Scheduled message was claimed by another instance while being delivered', scheduledMessageId: _id });
	}
};

/**
 * Delivers every scheduled message whose time has come. Claims are atomic, so running this on
 * several instances concurrently never delivers the same message twice.
 */
export async function dispatchScheduledMessages(now = new Date()): Promise<void> {
	await ScheduledMessages.requeueStale(new Date(now.getTime() - STALE_CLAIM_MS));

	for (let processed = 0; processed < MAX_MESSAGES_PER_RUN; processed++) {
		const claimId = Random.id();
		const scheduledMessage = await ScheduledMessages.claimNextDue(now, claimId);
		if (!scheduledMessage) {
			return;
		}

		try {
			await deliver(scheduledMessage, claimId);
		} catch (err: any) {
			logger.error({ msg: 'Failed to deliver scheduled message', scheduledMessageId: scheduledMessage._id, err });
			await ScheduledMessages.setAsFailed(scheduledMessage._id, claimId, err?.error || err?.message || 'error-unknown');
		}
	}
}
