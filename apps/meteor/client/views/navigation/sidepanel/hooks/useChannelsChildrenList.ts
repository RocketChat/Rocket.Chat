import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { pipe } from '../../../../lib/cachedStores';
import { Subscriptions } from '../../../../stores';
import { isUnreadSubscription } from '../../contexts/RoomsNavigationContext';

const sortByLmPipe = pipe<SubscriptionWithRoom>().sortByField('lm', -1);

/**
 * This helper function is used to ensure that the main room (main team room or parent's discussion room)
 * is always at the top of the list.
 */
const getMainRoomAndSort = (records: SubscriptionWithRoom[], unreadOnly: boolean, teamId?: string) => {
	const mainRoom = records.find((record) => (teamId ? record.teamMain : !record.prid));
	const filteredRecords = records.filter((record) => mainRoom?.rid !== record.rid);
	const sortedRecords = sortByLmPipe.apply(filteredRecords);
	const rest = !unreadOnly
		? sortedRecords
		: sortedRecords
				.reduce(
					(result, record) => {
						if (isUnreadSubscription(record)) {
							result[0].push(record);
							return result;
						}
						result[1].push(record);
						return result;
					},
					[[] as SubscriptionWithRoom[], [] as SubscriptionWithRoom[]],
				)
				.flat();

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

			return getMainRoomAndSort(records, unreadOnly, teamId);
		}),
	);
};
