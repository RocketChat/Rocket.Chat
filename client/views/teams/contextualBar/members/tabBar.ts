import { lazy } from 'react';

import { addAction } from '../../../room/lib/Toolbox';

addAction('team-members', {
	groups: ['team'],
	id: 'team-members',
	anonymous: true,
	full: true,
	title: 'Teams_members',
	icon: 'members',
	template: lazy(() => import('./index')),
	order: 6,
});
