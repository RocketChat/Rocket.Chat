import type { FC, LazyExoticComponent } from 'react';
import { lazy } from 'react';

import { addAction } from '../../../room/lib/Toolbox';

addAction('team-info', {
	groups: ['team'],
	id: 'team-info',
	anonymous: true,
	full: true,
	title: 'Teams_Info',
	icon: 'info-circled',
	template: lazy(() => import('./index.js')) as LazyExoticComponent<FC>,
	order: 1,
});
