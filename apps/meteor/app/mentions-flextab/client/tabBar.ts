import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('mentions', {
	groups: ['channel', 'group', 'team'],
	id: 'mentions',
	title: 'Mentions',
	icon: 'at',
	template: lazy(() => import('../../../client/views/room/contextualBar/Mentions')),
	order: 9,
});
