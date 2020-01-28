import { useMemo } from 'react';

import { ChatSubscription } from '../../../app/models/client/models/ChatSubscription';
import { menu } from '../../../app/ui-utils/client/lib/menu';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useSession } from '../../hooks/useSession';
import { useUserPreference } from '../../hooks/useUserPreference';

import './BurgerMenuButton.css';

export const useSidebarState = () => {
	const isOpen = useSession('isMenuOpen');
	const toggle = () => menu.toggle();
	return [isOpen, toggle];
};

export const useUnreadMessagesBadge = () => {
	const alertUnreadMessages = useUserPreference('unreadAlert') !== false;
	const openedRoom = useSession('openedRoom');
	const [unreadCount, unreadAlert] = useReactiveValue(() => ChatSubscription
		.find({
			open: true,
			hideUnreadStatus: { $ne: true },
			rid: { $ne: openedRoom },
		}, {
			fields: {
				unread: 1,
				alert: 1,
				unreadAlert: 1,
			},
		})
		.fetch()
		.reduce(([unreadCount, unreadAlert], { alert, unread, unreadAlert: alertType }) => {
			if (alert || unread > 0) {
				unreadCount += unread;
				if (alert === true && alertType !== 'nothing') {
					if (alertType === 'all' || alertUnreadMessages !== false) {
						unreadAlert = '•';
					}
				}
			}

			return [unreadCount, unreadAlert];
		}, [0, false]), [openedRoom, alertUnreadMessages]);

	return useMemo(() => {
		if (unreadCount > 0) {
			return unreadCount > 99 ? '99+' : unreadCount.toString(10);
		}

		return unreadAlert || '';
	}, [unreadCount, unreadAlert]);
};
