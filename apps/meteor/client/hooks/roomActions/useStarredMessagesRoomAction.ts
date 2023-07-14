import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const StarredMessagesTab = lazy(() => import('../../views/room/contextualBar/StarredMessagesTab'));

export const useStarredMessagesRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('starred-messages', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			id: 'starred-messages',
			title: 'Starred_Messages',
			icon: 'star',
			template: StarredMessagesTab,
			order: 10,
		});
	}, []);
};
