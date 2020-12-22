import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('starred-messages', {
	groups: ['channel', 'group', 'direct', 'live'],
	id: 'starred-messages',
	title: 'Starred_Messages',
	icon: 'star',
	template: lazy(() => import('../../../client/views/room/contextualBar/StarredMessages')),
	order: 10,
});
