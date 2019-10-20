import React, { useMemo } from 'react';

import { ChatSubscription } from '../../../app/models/client/models/ChatSubscription';
import { menu } from '../../../app/ui-utils/client/lib/menu';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useSession } from '../../hooks/useSession';
import { useUserPreference } from '../../hooks/useUserPreference';

import './BurgerMenuButton.css';

const useSidebarState = () => {
	const isOpen = useSession('isMenuOpen');
	const toggle = () => menu.toggle();
	return [isOpen, toggle];
};

const useUnreadMessagesBadge = () => {
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

export function BurgerMenuButton() {
	const [isSidebarOpen, toggleSidebarOpen] = useSidebarState();
	const isLayoutEmbedded = useEmbeddedLayout();
	const unreadMessagesBadge = useUnreadMessagesBadge();

	const handleClick = () => {
		toggleSidebarOpen();
	};

	return <button
		aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
		className={[
			'rc-old',
			'burger',
			!!isSidebarOpen && 'menu-opened',
		].filter(Boolean).join(' ')}
		type='button'
		onClick={handleClick}
	>
		<i className='burger__line' aria-hidden='true' />
		<i className='burger__line' aria-hidden='true' />
		<i className='burger__line' aria-hidden='true' />
		{!isLayoutEmbedded && unreadMessagesBadge
			&& <div className='unread-burger-alert color-error-contrast background-error-color'>
				{unreadMessagesBadge}
			</div>}
	</button>;
}
