import type { IMessage, IScheduledMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { ScheduledMessages } from '@rocket.chat/models';

import { i18n } from '../../lib/i18n';

export const STALE_SENDING_MS = 5 * 60 * 1000;

const logger = new Logger('ScheduledMessages');

type Deliver = (item: IScheduledMessage) => Promise<IMessage>;
export type Notify = (uid: string) => void;

const toErrorKey = (err: unknown): string => {
	if (typeof err === 'string') {
		return err;
	}
	const { error, message } = (err ?? {}) as { error?: unknown; message?: unknown };
	const key = [error, message].find((value): value is string => typeof value === 'string' && i18n.exists(value));
	return key ?? 'error-scheduled-message-failed';
};

export const sendClaimed = async (item: IScheduledMessage, deliver: Deliver, notify: Notify): Promise<IMessage> => {
	const message = await deliver(item).catch(async (err) => {
		await ScheduledMessages.setFailedById(item._id, toErrorKey(err));
		notify(item.u._id);
		throw err;
	});
	await ScheduledMessages.removeById(item._id);
	notify(item.u._id);
	return message;
};

export const processDueScheduledMessages = async (deliver: Deliver, notify: Notify, now = new Date()): Promise<void> => {
	const claimedBefore = new Date(now.getTime() - STALE_SENDING_MS);
	const error = 'error-scheduled-message-interrupted';
	for await (const item of ScheduledMessages.findStaleSending(claimedBefore)) {
		await ScheduledMessages.setFailedById(item._id, error);
		notify(item.u._id);
	}

	for (let item = await ScheduledMessages.claimNextDue(now); item; item = await ScheduledMessages.claimNextDue(now)) {
		const { _id: scheduledMessageId } = item;
		await sendClaimed(item, deliver, notify).catch((err) =>
			logger.warn({ msg: 'Could not send a scheduled message', scheduledMessageId, err }),
		);
	}
};
