import type { FC, LazyExoticComponent } from 'react';
import { lazy } from 'react';

import { ui } from '../../../../lib/ui';

ui.addRoomAction('team-info', {
	groups: ['team'],
	id: 'team-info',
	anonymous: true,
	full: true,
	title: 'Teams_Info',
	icon: 'info-circled',
	template: lazy(() => import('.')) as LazyExoticComponent<FC>,
	order: 1,
});
