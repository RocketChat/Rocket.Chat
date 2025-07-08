import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { Subscriptions } from '../../../../../app/models/client';
import { pipe } from '../../../../lib/cachedCollections';

export const useChannelsChildrenList = (parentRid: string, unreadOnly: boolean, teamId?: string) => {
	return Subscriptions.use(
		useShallow((state) => {
			const records = state.filter((subscription) => {
				if (subscription.prid !== parentRid && subscription.rid !== parentRid) {
					if (!teamId) {
						return false;
					}

					if (teamId && subscription.teamId !== teamId) {
						return false;
					}
				}
				if (unreadOnly && subscription.unread === 0) {
					return false;
				}
				return true;
			});

			const { apply: transform } = pipe<SubscriptionWithRoom>().sortByField('lm', 1);

			return transform(records);
		}),
	);
};
