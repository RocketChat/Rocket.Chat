import type { FC, LazyExoticComponent } from 'react';
import { lazy } from 'react';

import { ui } from '../../../client/lib/ui';

ui.addRoomAction('channel-settings', {
	groups: ['channel', 'group'],
	id: 'channel-settings',
	anonymous: true,
	full: true,
	title: 'Room_Info',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/views/room/contextualBar/Info')) as LazyExoticComponent<FC>,
	order: 1,
});
