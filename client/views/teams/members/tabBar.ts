import { FC, lazy, LazyExoticComponent } from 'react';

import { addAction } from '../../room/lib/Toolbox';

addAction('team-members', {
	groups: ['team'],
	id: 'team-members',
	anonymous: true,
	full: true,
	title: 'Teams_members',
	icon: 'members',
	template: lazy(() => import('./index')) as LazyExoticComponent<FC>,
	order: 7,
});
