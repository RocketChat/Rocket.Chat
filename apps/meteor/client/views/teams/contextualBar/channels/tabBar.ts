import type { FC, LazyExoticComponent } from 'react';
import { lazy } from 'react';

import { ui } from '../../../../lib/ui';

ui.addRoomAction('team-channels', {
	groups: ['team'],
	id: 'team-channels',
	anonymous: true,
	full: true,
	title: 'Team_Channels',
	icon: 'hash',
	template: lazy(() => import('./index')) as LazyExoticComponent<FC>,
	order: 2,
});
