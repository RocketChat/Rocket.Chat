import { lazy } from 'react';

import { addAction } from '../../views/room/lib/Toolbox';

addAction('mentions', {
	groups: ['channel', 'group', 'team'],
	id: 'mentions',
	title: 'Mentions',
	icon: 'at',
	template: lazy(() => import('../../views/room/contextualBar/MentionsTab')),
	order: 9,
});
