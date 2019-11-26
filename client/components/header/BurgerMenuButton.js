import React, { useMemo } from 'react';

import { ChatSubscription } from '../../../app/models/client/models/ChatSubscription';
import { Layout } from '../../../app/ui-utils/client/lib/Layout';
import { useSession } from '../../hooks/useSession';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useUserPreference } from '../../hooks/useUserPreference';
import { menu } from '../../../app/ui-utils/client/lib/menu';

import './BurgerMenuButton.css';

const useBurgerMenuState = () => {
	const isMenuOpen = useSession('isMenuOpen');
	const isLayoutEmbedded = useReactiveValue(() => Layout.isEmbedded(), []);

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

	const unreadBadge = useMemo(() => {
		if (unreadCount > 0) {
			return unreadCount > 99 ? '99+' : unreadCount.toString(10);
		}

		return unreadAlert || '';
	}, [unreadCount, unreadAlert]);

	return { isMenuOpen, isLayoutEmbedded, unreadBadge };
};

export function BurgerMenuButton() {
	const { isMenuOpen, isLayoutEmbedded, unreadBadge } = useBurgerMenuState();

	const handleClick = () => {
		menu.toggle();
	};

	return <button
		aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
		className={[
			'rc-old',
			'burger',
			'menu-opened',
		].filter(Boolean).join(' ')}
		type='button' 
		onClick={handleClick}
	>
		<i className='burger__line' aria-hidden='true' />
		<i className='burger__line' aria-hidden='true' />
		<i className='burger__line' aria-hidden='true' />
		{!isLayoutEmbedded && unreadBadge
			&& <div className='unread-burger-alert color-error-contrast background-error-color'>
				{unreadBadge}
			</div>}
	</button>;
}
