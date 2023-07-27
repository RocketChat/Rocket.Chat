import { lazy } from 'react';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('voip-room-info', {
	groups: ['voip'],
	id: 'voip-room-info',
	title: 'Call_Information',
	icon: 'info-circled',
	template: lazy(() => import('../../../client/views/omnichannel/directory/calls/contextualBar/CallsContextualBarRoom')),
	order: 0,
});
