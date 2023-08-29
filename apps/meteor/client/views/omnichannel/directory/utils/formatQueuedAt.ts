import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import moment from 'moment';

export const formatQueuedAt = (room: IOmnichannelRoom) => {
	const { servedBy, closedAt, open, queuedAt, ts } = room || {};
	const queueStartedAt = queuedAt || ts;

	// Room served
	if (servedBy) {
		return moment(servedBy.ts).from(moment(queueStartedAt), true);
	}

	// Room open and not served
	if (open) {
		return moment(queueStartedAt).fromNow(true);
	}

	// Room closed and not served
	if (closedAt && queueStartedAt) {
		return moment(closedAt).from(moment(queueStartedAt), true);
	}

	return '';
};
