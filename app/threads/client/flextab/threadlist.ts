import { useMemo, lazy, LazyExoticComponent, FC } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { useSetting } from '../../../../client/contexts/SettingsContext';

addAction('thread', () => {
	const threadsEnabled = useSetting('Threads_enabled');
	return useMemo(() => (threadsEnabled ? {
		groups: ['channel', 'group', 'direct'],
		id: 'thread',
		full: true,
		title: 'Threads',
		icon: 'thread',
		template: lazy(() => import('../../../../client/views/room/ContextualBar/Threads')) as LazyExoticComponent<FC>,
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
		order: 2,
	} : null), [threadsEnabled]);
});
