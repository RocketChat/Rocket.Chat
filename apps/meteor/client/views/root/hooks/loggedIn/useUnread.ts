import { manageFavicon } from '@rocket.chat/favicon';
import { useSession, useSessionDispatch, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { useFireGlobalEvent } from '../../../../hooks/useFireGlobalEvent';

const query = { open: { $ne: false }, hideUnreadStatus: { $ne: true }, archived: { $ne: true } };
const options = { fields: { unread: 1, alert: 1, rid: 1, t: 1, name: 1, ls: 1, unreadAlert: 1, fname: 1, prid: 1 } };
const updateFavicon = manageFavicon();

type UnreadData = { unread: number; alert: boolean | undefined; unreadAlert: string | undefined };

export const useUnread = () => {
	const unreadAlertEnabled = useUserPreference('unreadAlert');
	const setUnread = useSessionDispatch('unread');
	const unread = useSession('unread') as string | number | null | undefined;

	const { mutate: fireEventUnreadChangedBySubscription } = useFireGlobalEvent('unread-changed-by-subscription');
	const { mutate: fireEventUnreadChanged } = useFireGlobalEvent('unread-changed');

	const subscriptions = useUserSubscriptions(query, options);

	// We keep a lightweight snapshot of the last emitted per-subscription unread state so we only
	// fire "unread-changed-by-subscription" for subscriptions whose unread-relevant fields changed.
	// Previously we emitted one global event per subscription on ANY change, which scaled O(N)
	// with the user subscription count (thousands) for every single message event, dominating CPU.
	const prevSubsRef = useRef(new Map<string, UnreadData>());

	useEffect(() => {
		let badgeIndicator: false | '•' = false;
		let unreadCount = 0;
		const nextSnapshot = new Map<string, UnreadData>();

		for (const subscription of subscriptions) {
			const { rid, unread: unreadValue, alert, unreadAlert: subscriptionUnreadAlert } = subscription;
			const prev = prevSubsRef.current.get(rid);
			// Emit per-sub event only if something that influences unread UI changed.
			if (!prev || prev.unread !== unreadValue || prev.alert !== alert || prev.unreadAlert !== subscriptionUnreadAlert) {
				fireEventUnreadChangedBySubscription(subscription);
			}
			nextSnapshot.set(rid, { unread: unreadValue, alert, unreadAlert: subscriptionUnreadAlert });

			if (alert || unreadValue > 0) {
				if (alert === true && subscriptionUnreadAlert !== 'nothing') {
					if (subscriptionUnreadAlert === 'all' || unreadAlertEnabled !== false) {
						badgeIndicator = '•';
					}
				}
				unreadCount += unreadValue;
			}
		}

		prevSubsRef.current = nextSnapshot; // swap snapshot

		if (unreadCount > 0) {
			setUnread(unreadCount > 999 ? '999+' : unreadCount);
		} else if (badgeIndicator !== false) {
			setUnread(badgeIndicator);
		} else {
			setUnread('');
		}

		fireEventUnreadChanged(unreadCount);
	}, [setUnread, subscriptions, unreadAlertEnabled, fireEventUnreadChangedBySubscription, fireEventUnreadChanged]);

	useEffect(() => {
		updateFavicon(unread);
	}, [unread]);
};
