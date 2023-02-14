import type { FC, LazyExoticComponent } from 'react';
import { lazy } from 'react';

import { addAction } from '../../../room/lib/Toolbox';

addAction('team-channels', {
	groups: ['team'],
	id: 'team-channels',
	anonymous: true,
	full: true,
	title: 'Team_Channels',
	icon: 'hash',
	template: lazy(() => import('./index')) as LazyExoticComponent<FC>,
	order: 2,
});
