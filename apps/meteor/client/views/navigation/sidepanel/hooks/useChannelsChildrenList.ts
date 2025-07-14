import type { ISubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { Subscriptions } from '../../../../../app/models/client';
import { pipe } from '../../../../lib/cachedCollections';

const filterUnread = (subscription: ISubscription, unreadOnly: boolean) => (unreadOnly ? subscription.unread > 0 : true);

export const useChannelsChildrenList = (parentRid: string, unreadOnly: boolean, teamId?: string) => {
	return Subscriptions.use(
		useShallow((state) => {
			const records = state.filter((subscription) => {
				if (parentRid === subscription.prid || parentRid === subscription.rid) {
					return filterUnread(subscription, unreadOnly);
				}
				if (teamId && subscription.teamId === teamId) {
					return filterUnread(subscription, unreadOnly);
				}
				return false;
			});

			const { apply: transform } = pipe<SubscriptionWithRoom>().sortByField('lm', 1);

			return transform(records);
		}),
	);
};
