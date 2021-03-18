import { lazy, LazyExoticComponent, FC, useMemo } from 'react';

import { addAction } from '../../room/lib/Toolbox';

addAction('team-channels', () => {
	const t = true;
	return useMemo(() => (t ? {
		groups: ['team'],
		id: 'team-channels',
		anonymous: true,
		title: 'Team-Channels',
		icon: 'hash',
		template: lazy(() => import('./TeamChannels')) as LazyExoticComponent<FC>,
		full: true,
		order: 8,
	} : null), [t]);
});
