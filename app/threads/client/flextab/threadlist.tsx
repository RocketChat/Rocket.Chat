import React, { useMemo, lazy, LazyExoticComponent, FC } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { useSetting } from '../../../../client/contexts/SettingsContext';
import Header from '../../../../client/components/Header';
import { IRoom } from '../../../../definition/IRoom';
import { ISubscription } from '/definition/ISubscription';
// badge: () => {
// 	const subscription = Subscriptions.findOne({ rid: Session.get('openedRoom') }, { fields: { tunread: 1, tunreadUser: 1, tunreadGroup: 1 } });
// 	if (!subscription?.tunread?.length) {
// 		return;
// 	}

// 	const badgeClass = (() => {
// 		if (subscription.tunreadUser?.length > 0) {
// 			return 'rc-badge--user-mentions';
// 		}
// 		if (subscription.tunreadGroup?.length > 0) {
// 			return 'rc-badge--group-mentions';
// 		}
// 	})();

// 	return {
// 		body: subscription.tunread.length > 99 ? '99+' : subscription.tunread.length,
// 		class: badgeClass,
// 	};
// },

const getVariant = (room: ISubscription) => {
	if (room.tunreadUser?.length > 0) {
		return 'danger';
	}
	if (room.tunreadGroup?.length > 0) {
		return 'warning';
	}
	return 'primary';
};

const template = lazy(() => import('../../../../client/views/room/contextualBar/Threads')) as LazyExoticComponent<FC>;

addAction('thread', (options) => {
	const room = options.room as unknown as ISubscription;
	const threadsEnabled = useSetting('Threads_enabled');
	return useMemo(() => (threadsEnabled ? {
		groups: ['channel', 'group', 'direct'],
		id: 'thread',
		full: true,
		title: 'Threads',
		icon: 'thread',
		template,
		renderAction: (props) => {
			const unread = room.tunread?.length > 99 ? '99+' : room.tunread?.length;
			const variant = getVariant(room);
			return <Header.ToolBoxAction {...props} >
				{ unread > 0 && <Header.ToolBoxAction.Badge variant={variant}>{unread}</Header.ToolBoxAction.Badge> }
			</Header.ToolBoxAction>;
		},
		order: 2,
	} : null), [threadsEnabled, room?.tunread]);
});
