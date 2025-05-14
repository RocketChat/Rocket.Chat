import { manageFavicon } from '@rocket.chat/favicon';
import { useSession, useSessionDispatch, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Rooms } from '../../app/models/client';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

const query = { open: { $ne: false }, hideUnreadStatus: { $ne: true }, archived: { $ne: true } };
const options = { fields: { unread: 1, alert: 1, rid: 1, t: 1, name: 1, ls: 1, unreadAlert: 1, fname: 1, prid: 1 } };

export const useUnread = () => {
	const unreadAlertEnabled = useUserPreference('unreadAlert');
	const setUnread = useSessionDispatch('unread');
	const unread = useSession('unread') as string | number | null | undefined;

	const subscriptions = useUserSubscriptions(query, options);

	useEffect(() => {
		let unreadAlert: false | '•' = false;

		const unreadCount = subscriptions.reduce((ret, subscription) => {
			const room = Rooms.findOne({ _id: subscription.rid }, { fields: { usersCount: 1 } });
			fireGlobalEvent('unread-changed-by-subscription', {
				...subscription,
				usersCount: room?.usersCount,
			});

			if (subscription.alert || subscription.unread > 0) {
				// Increment the total unread count.
				if (subscription.alert === true && subscription.unreadAlert !== 'nothing') {
					if (subscription.unreadAlert === 'all' || unreadAlertEnabled !== false) {
						unreadAlert = '•';
					}
				}
				return ret + subscription.unread;
			}
			return ret;
		}, 0);

		if (unreadCount > 0) {
			if (unreadCount > 999) {
				setUnread('999+');
			} else {
				setUnread(unreadCount);
			}
		} else if (unreadAlert !== false) {
			setUnread(unreadAlert);
		} else {
			setUnread('');
		}
		fireGlobalEvent('unread-changed', unreadCount);
	}, [setUnread, subscriptions, unread, unreadAlertEnabled]);

	useEffect(() => {
		const updateFavicon = manageFavicon();
		updateFavicon(unread);
	}, [unread, setUnread]);
};
