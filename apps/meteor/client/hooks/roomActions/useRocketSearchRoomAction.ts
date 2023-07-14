import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const MessageSearchTab = lazy(() => import('../../views/room/contextualBar/MessageSearchTab'));

export const useRocketSearchRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('rocket-search', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
			id: 'rocket-search',
			title: 'Search_Messages',
			icon: 'magnifier',
			template: MessageSearchTab,
			order: 6,
		});
	}, []);
};
