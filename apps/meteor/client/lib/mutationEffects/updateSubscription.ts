import type { ISubscription } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../../app/models/client';

export const updateSubscription = (roomId: string, userId: string, data: Partial<ISubscription>) => {
	const oldDocument = Subscriptions.findOne({ 'rid': roomId, 'u._id': userId });

	Subscriptions.update({ 'rid': roomId, 'u._id': userId }, { $set: data });

	return oldDocument;
};
