import { FC, lazy, LazyExoticComponent } from 'react';

import { addAction } from '../../room/lib/Toolbox';

addAction('team-members', (room) => {
	console.log(room);

	return {
		groups: ['team'],
		id: 'team-members',
		anonymous: true,
		full: true,
		title: 'Teams_Members',
		icon: 'members',
		template: lazy(() => import('./TeamsMembers.js')) as LazyExoticComponent<FC>,
		order: 7,
	};
});
