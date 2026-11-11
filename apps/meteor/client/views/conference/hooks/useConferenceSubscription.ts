import type { ISubscription } from '@rocket.chat/core-typings';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useRoomSubscriptionQuery } from './useRoomSubscriptionQuery';
import { RoomsCachedStore, SubscriptionsCachedStore } from '../../../cachedStores';
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
	const subscribeToNotifyUser = useStream('notify-user');

	const { data } = useRoomSubscriptionQuery(uid ? rid : undefined);

	// The room UI waits on the cached stores being *ready* — a flag the sidebar's subscriptions normally set once
	// they have loaded. Nothing loads them in this window, and nothing needs to: the room the chat panel shows is
	// the one room in play, and this hook and `useOpenRoomById` fetch it between them. So this says the stores are
	// as loaded as they are going to get, which is what unblocks the room.
	//
	// Said here rather than by a component wrapping the panel: it is about the same room, at the same time, as
	// everything else this hook does, and a component whose whole body was an effect was a component in name only.
	useEffect(() => {
		SubscriptionsCachedStore.setReady(true);
		RoomsCachedStore.setReady(true);
	}, []);

	// Watching the result rather than hydrating inside the query function, which was the tidier place right up
	// until the key became a shared one: a window that arrives with the subscription already cached — from the
	// start screen, which asks for the same thing — never runs the function, and the store it feeds is what the
	// closed chat's unread badge reads. `upsertSubscription` is idempotent, so a repeat costs nothing.
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
