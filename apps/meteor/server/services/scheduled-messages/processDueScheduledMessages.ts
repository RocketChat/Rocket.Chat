import type { IMessage, IScheduledMessage } from '@rocket.chat/core-typings';
import { ScheduledMessages } from '@rocket.chat/models';

export const STALE_SENDING_MS = 5 * 60 * 1000;

export type Deliver = (item: IScheduledMessage) => Promise<IMessage>;
export type Notify = (uid: string) => void;

const toErrorKey = (err: unknown): string => {
	if (typeof err === 'string') {
		return err;
	}
	const { error, message } = (err ?? {}) as { error?: unknown; message?: unknown };
	if (typeof error === 'string') {
		return error;
	}
	return typeof message === 'string' && message ? message : 'error-scheduled-message-failed';
};

export const sendClaimed = async (item: IScheduledMessage, deliver: Deliver, notify: Notify): Promise<IMessage> => {
	try {
		const message = await deliver(item);
		await ScheduledMessages.removeById(item._id);
		notify(item.u._id);
		return message;
	} catch (err) {
		const error = toErrorKey(err);
		await ScheduledMessages.setFailedById(item._id, error);
		notify(item.u._id);
		throw err;
	}
};

export const processDueScheduledMessages = async (deliver: Deliver, notify: Notify, now = new Date()): Promise<void> => {
	const claimedBefore = new Date(now.getTime() - STALE_SENDING_MS);
	const error = 'error-scheduled-message-interrupted';
	for await (const item of ScheduledMessages.findStaleSending(claimedBefore)) {
		await ScheduledMessages.setFailedById(item._id, error);
		notify(item.u._id);
	}

	for (let item = await ScheduledMessages.claimNextDue(now); item; item = await ScheduledMessages.claimNextDue(now)) {
		await sendClaimed(item, deliver, notify).catch(() => undefined);
	}
};
