import { FC, lazy, LazyExoticComponent } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('channel-settings', {
	groups: ['channel', 'group'],
	id: 'channel-settings',
	anonymous: true,
	full: true,
	title: 'Room_Info',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/views/room/contextualBar/Info')) as LazyExoticComponent<FC>,
	order: 1,
});
