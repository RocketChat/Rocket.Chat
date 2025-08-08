import type { ISubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { pipe } from '../../../../lib/cachedStores';
import { Subscriptions } from '../../../../stores';

const filterUnread = (subscription: ISubscription, unreadOnly: boolean) => !unreadOnly || subscription.unread > 0;

const sortByLmPipe = pipe<SubscriptionWithRoom>().sortByField('lm', -1);

/**
 * This helper function is used to ensure that the main room (main team room or parent's discussion room)
 * is always at the top of the list.
 */
const getMainRoomAndSort = (records: SubscriptionWithRoom[]) => {
	const [mainRoom, ...rest] = records;
	return [mainRoom, ...sortByLmPipe.apply(rest)];
};

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

			if (!records.length) {
				return [];
			}

			return getMainRoomAndSort(records);
		}),
	);
};
