import { lazy } from 'react';

import { addAction } from '../../views/room/lib/Toolbox';

addAction('starred-messages', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
	id: 'starred-messages',
	title: 'Starred_Messages',
	icon: 'star',
	template: lazy(() => import('../../views/room/contextualBar/StarredMessagesTab')),
	order: 10,
});
