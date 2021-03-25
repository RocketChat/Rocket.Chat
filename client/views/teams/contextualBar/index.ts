import { lazy, LazyExoticComponent, FC } from 'react';

import { addAction } from '../../room/lib/Toolbox';

addAction('team-channels', () => ({
	groups: ['team'],
	id: 'team-channels',
	anonymous: true,
	title: 'Team_Channels',
	icon: 'hash',
	template: lazy(() => import('./TeamChannels')) as LazyExoticComponent<FC>,
	full: true,
	order: 8,
}));
