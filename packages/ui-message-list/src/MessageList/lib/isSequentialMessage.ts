import type { IMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { differenceInSeconds } from 'date-fns/differenceInSeconds';

import { isSameDay } from './isSameDay';

export type SequentialMessageOptions = {
	groupingPeriodSeconds: number;
	/**
	 * Whether thread replies show as previews of their thread, as in a room, where a reply continues the thread above it
	 * whoever wrote it. Inside a thread every message is a reply, so grouping falls back to the author.
	 */
	groupsThreadReplies?: boolean;
};

/**
 * Tells whether `current` continues `previous` visually, so it renders without its own header.
 */
export const isSequentialMessage = (
	current: IMessage,
	previous: IMessage | undefined,
	{ groupingPeriodSeconds, groupsThreadReplies = true }: SequentialMessageOptions,
): boolean => {
	if (!previous) {
		return false;
	}

	if (MessageTypes.isSystemMessage(current) || MessageTypes.isSystemMessage(previous)) {
		return false;
	}

	if (groupsThreadReplies) {
		if (current.tmid) {
			return [previous.tmid, previous._id].includes(current.tmid);
		}

		if (previous.tmid) {
			return false;
		}
	}

	if (current.groupable === false) {
		return false;
	}

	if (current.u._id !== previous.u._id) {
		return false;
	}

	if (current.alias !== previous.alias) {
		return false;
	}

	return differenceInSeconds(current.ts, previous.ts) < groupingPeriodSeconds && isSameDay(current.ts, previous.ts);
};
