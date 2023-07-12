import { lazy } from 'react';

import { ui } from '../../lib/ui';

ui.addRoomAction('mentions', {
	groups: ['channel', 'group', 'team'],
	id: 'mentions',
	title: 'Mentions',
	icon: 'at',
	template: lazy(() => import('../../views/room/contextualBar/MentionsTab')),
	order: 9,
});
