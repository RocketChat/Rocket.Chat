import type { ISubscription } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../stores';

export const updateSubscription = (roomId: string, userId: string, data: Partial<ISubscription>) => {
	const oldDocument = Subscriptions.state.find((record) => record.rid === roomId && record.u._id === userId);

	Subscriptions.state.update(
		(record) => record.rid === roomId && record.u._id === userId,
		(record) => ({ ...record, ...data }),
	);

	return oldDocument;
};
