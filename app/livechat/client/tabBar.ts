import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('visitor-info', {
	groups: ['live'],
	id: 'visitor-info',
	title: 'Visitor_Info',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/omnichannel/directory/chats/contextualBar')),
	order: 0,
});
