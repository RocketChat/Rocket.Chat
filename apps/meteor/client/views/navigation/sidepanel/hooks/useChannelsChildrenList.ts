import type { ISubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useShallow } from 'zustand/shallow';

import { Subscriptions } from '../../../../../app/models/client';
import { pipe } from '../../../../lib/cachedCollections';

const filterUnread = (subscription: ISubscription, unreadOnly: boolean) => (unreadOnly ? subscription.unread > 0 : true);

export const useChannelsChildrenList = (parentRid: string, unreadOnly: boolean, teamId?: string) => {
	/**
	 * This helper function is used to ensure that the main room (main team room or parent's discussion room)
	 * is always at the top of the list.
	 */
	const getMainRoomAndSort = (records: SubscriptionWithRoom[]) => {
		const [mainRoom] = pipe<SubscriptionWithRoom>().slice(0, 1).apply(records);
		const rest = pipe<SubscriptionWithRoom>()
			.sortByField('lm', -1)
			.apply(records)
			.filter((subscription) => subscription.rid !== mainRoom?.rid);

		return [mainRoom, ...rest];
	};

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
