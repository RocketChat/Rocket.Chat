import React, { useLayoutEffect, useMemo, useRef } from 'react';

import { ChatSubscription } from '../../../app/models/client/models/ChatSubscription';
import { Layout } from '../../../app/ui-utils/client/lib/Layout';
import { useSession } from '../../hooks/useSession';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useUserPreference } from '../../hooks/useUserPreference';

export function Burger() {
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

	const unread = useMemo(() => {
		if (unreadCount > 0) {
			return unreadCount > 99 ? '99+' : unreadCount;
		}

		return unreadAlert || '';
	}, [unreadCount, unreadAlert]);

	const firstChildRef = useRef();

	useLayoutEffect(() => {
		const container = firstChildRef.current && firstChildRef.current.parentElement;
		if (!container) {
			return;
		}

		container.classList.add('rc-old');
		container.classList.add('burger');
		container.classList.toggle('menu-opened', !!isMenuOpen);
	}, [isMenuOpen]);

	return <>
		<i ref={firstChildRef}></i>
		<i></i>
		<i></i>
		{!isLayoutEmbedded && unread
			&& <div className='unread-burger-alert color-error-contrast background-error-color'>
				{unread}
			</div>}
	</>;
}
