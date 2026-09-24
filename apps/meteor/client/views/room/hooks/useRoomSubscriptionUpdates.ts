import type { ISubscription } from '@rocket.chat/core-typings';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { SubscriptionsCachedStore } from '../../../cachedStores';
import { shouldApplySubscriptionChange } from '../lib/shouldApplySubscriptionChange';

/** Keeps the viewer's subscription to one room current where no sidebar watcher runs (embedded layout, conference) */
export const useRoomSubscriptionUpdates = (rid: string | undefined): void => {
	const uid = useUserId();
	const subscribeToNotifyUser = useStream('notify-user');

	useEffect(() => {
		if (!uid || !rid) {
			return;
		}

		return subscribeToNotifyUser(`${uid}/subscriptions-changed`, (event, sub) => {
			if (!shouldApplySubscriptionChange(event, sub?.rid, rid)) {
				return;
			}

			SubscriptionsCachedStore.upsertSubscription(sub as ISubscription);
		});
	}, [rid, subscribeToNotifyUser, uid]);
};
