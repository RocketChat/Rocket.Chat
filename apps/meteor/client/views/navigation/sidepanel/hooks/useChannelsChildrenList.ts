import type { ISubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { pipe } from '../../../../lib/cachedStores';
import { Subscriptions } from '../../../../stores';

export const isUnreadSubscription = (subscription: ISubscription) => {
	return (
		subscription.userMentions > 0 ||
		subscription.groupMentions > 0 ||
		!!(subscription.tunread && subscription.tunread?.length > 0) ||
		!!(subscription.tunreadUser && subscription.tunreadUser?.length > 0) ||
		!!(!subscription.unread && !subscription.tunread?.length && subscription.alert)
	);
};

const filterUnread = (subscription: ISubscription, unreadOnly: boolean) => !unreadOnly || isUnreadSubscription(subscription);

const sortByLmPipe = pipe<SubscriptionWithRoom>().sortByField('lm', -1);

/**
 * This helper function is used to ensure that the main room (main team room or parent's discussion room)
 * is always at the top of the list.
 */
const getMainRoomAndSort = (records: SubscriptionWithRoom[]) => {
	const mainRoom = records.find((record) => !record.prid);
	const rest = sortByLmPipe.apply(records.filter((record) => mainRoom?.rid !== record.rid));

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
