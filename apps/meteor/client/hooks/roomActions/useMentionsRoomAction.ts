import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const MentionsTab = lazy(() => import('../../views/room/contextualBar/MentionsTab'));

export const useMentionsRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('mentions', {
			groups: ['channel', 'group', 'team'],
			id: 'mentions',
			title: 'Mentions',
			icon: 'at',
			template: MentionsTab,
			order: 9,
		});
	}, []);
};
