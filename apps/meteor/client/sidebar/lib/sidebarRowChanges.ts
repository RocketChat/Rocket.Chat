import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

const differentDate = (a?: Date, b?: Date): boolean => {
	if (!a || !b) {
		return a !== b;
	}

	return a.toISOString() !== b.toISOString();
};

/**
 * Whether a row has anything new to say about its room.
 *
 * Only the fields a row draws are compared, plus `_updatedAt` — which the server bumps for the
 * counters a row shows but this does not name, so it stands in for them. A field a row starts
 * drawing without appearing here, and without moving `_updatedAt`, will not reach the screen.
 */
export const hasRoomChanged = (previous: SubscriptionWithRoom, next: SubscriptionWithRoom): boolean => {
	if (previous === next) {
		return false;
	}

	if (previous._id !== next._id) {
		return true;
	}

	if (differentDate(previous._updatedAt, next._updatedAt)) {
		return true;
	}

	if (differentDate(previous.lastMessage?._updatedAt, next.lastMessage?._updatedAt)) {
		return true;
	}

	if (previous.lastMessage?.msg !== next.lastMessage?.msg) {
		return true;
	}

	if (previous.alert !== next.alert || previous.draft !== next.draft || previous.threadDrafts !== next.threadDrafts) {
		return true;
	}

	if (previous.teamMain !== next.teamMain) {
		return true;
	}

	if (isOmnichannelRoom(previous) && isOmnichannelRoom(next)) {
		return previous.v?.status !== next.v?.status || previous.priorityWeight !== next.priorityWeight;
	}

	return false;
};
