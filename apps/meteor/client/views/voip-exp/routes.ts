import { Meteor } from 'meteor/meteor';
import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerVoIPRoutes = createRouteGroup(
	'voipexp',
	'/voipexp',
	lazy(() => import('./VoipRouter')),
);

Meteor.startup(() => {
	console.log('Server started');
});
