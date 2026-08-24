import type { ISubscription } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { SubscriptionsCachedStore } from '../../../cachedStores';
import { mapSubscriptionFromApi } from '../../../lib/utils/mapSubscriptionFromApi';

/**
 * Whether a subscription change is one to apply here: this room's, and not its removal — a removed subscription
 * is the room going away from under them, not an update to fold in.
 */
export const shouldApplySubscriptionChange = (event: string, subRid: string | undefined, rid: string): boolean =>
	event !== 'removed' && subRid === rid;

/**
 * Keeps the user's subscription to the conference's chat in the store, and keeps it current.
 *
 * This belongs to the conference page rather than to the chat panel, because the thing that needs it most is the
 * unread badge on the *closed* chat — and the panel that used to own it isn't mounted then. Nothing else on the
 * page runs a subscriptions watcher either: the conference renders outside the main app, so the sidebar's own
 * watcher never starts.
 */
export const useConferenceSubscription = (rid: string | undefined): void => {
	const uid = useUserId();
	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');
	const subscribeToNotifyUser = useStream('notify-user');

	const { data } = useQuery({
		queryKey: ['conference', 'subscription', rid, uid],
		queryFn: async () => (await getSubscription({ roomId: rid as string })).subscription ?? null,
		enabled: !!rid && !!uid,
		retry: false,
	});

	useEffect(() => {
		if (data) {
			SubscriptionsCachedStore.upsertSubscription(mapSubscriptionFromApi(data));
		}
	}, [data]);

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
