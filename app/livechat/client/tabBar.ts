import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('room-info', {
	groups: ['live'],
	id: 'room-info',
	title: 'Room_Info',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/omnichannel/directory/chats/contextualBar')),
	order: 0,
});
