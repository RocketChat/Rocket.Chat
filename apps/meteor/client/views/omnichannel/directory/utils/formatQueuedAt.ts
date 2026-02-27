import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { formatDistance } from 'date-fns';

export const formatQueuedAt = (room: Serialized<IOmnichannelRoom> | undefined) => {
	const { servedBy, closedAt, open, queuedAt, ts } = room || {};
	const queueStartedAt = queuedAt || ts;

	// Room served: time from queueStartedAt to servedBy.ts
	if (servedBy) {
		return formatDistance(new Date(servedBy.ts), new Date(queueStartedAt), { addSuffix: false });
	}

	// Room open and not served: time from queueStartedAt to now
	if (open) {
		return formatDistance(new Date(), new Date(queueStartedAt), { addSuffix: false });
	}

	// Room closed and not served: time from queueStartedAt to closedAt
	if (closedAt && queueStartedAt) {
		return formatDistance(new Date(closedAt), new Date(queueStartedAt), { addSuffix: false });
	}

	return '';
};
