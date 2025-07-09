import type { ISubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { Subscriptions } from '../../../../../app/models/client';
import { pipe } from '../../../../lib/cachedCollections';

const isUnreadOnly = (subscription: ISubscription, unreadOnly: boolean) => unreadOnly && subscription.unread > 0;

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
				if (!isUnreadOnly(subscription, unreadOnly)) {
					return false;
				}
				return true;
			});

			const { apply: transform } = pipe<SubscriptionWithRoom>().sortByField('lm', 1);

			return transform(records);
		}),
	);
};
