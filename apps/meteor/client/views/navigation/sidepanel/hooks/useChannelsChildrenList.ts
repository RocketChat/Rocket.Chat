import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { pipe } from '../../../../lib/cachedStores';
import { Subscriptions } from '../../../../stores';
import { isUnreadSubscription } from '../../contexts/RoomsNavigationContext';

const sortByLmPipe = pipe<SubscriptionWithRoom>().sortByField('lm', -1);

const sortByUnread = (a: SubscriptionWithRoom, b: SubscriptionWithRoom) =>
	(isUnreadSubscription(b) ? 1 : 0) - (isUnreadSubscription(a) ? 1 : 0);

/**
 * This helper function is used to ensure that the main room (main team room or parent's discussion room)
 * is always at the top of the list.
 */
const getMainRoomAndSort = (records: SubscriptionWithRoom[], unreadOnly: boolean) => {
	const mainRoom = records.find((record) => !record.prid);
	const filteredRecords = records.filter((record) => mainRoom?.rid !== record.rid);
	const rest = sortByLmPipe.apply(unreadOnly ? filteredRecords.sort(sortByUnread) : filteredRecords);

	if (mainRoom) {
		rest.unshift(mainRoom);
	}

	return rest;
};

export const useChannelsChildrenList = (parentRid: string, unreadOnly: boolean, teamId?: string) => {
	return Subscriptions.use(
		useShallow((state) => {
			const records = state.filter((subscription) => {
				if (parentRid === subscription.prid || parentRid === subscription.rid) {
					return true;
				}
				if (teamId && subscription.teamId === teamId) {
					return true;
				}
				return false;
			});

			if (!records.length) {
				return [];
			}

			return getMainRoomAndSort(records, unreadOnly);
		}),
	);
};
