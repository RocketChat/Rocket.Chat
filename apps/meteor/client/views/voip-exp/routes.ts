import { Meteor } from 'meteor/meteor';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerVoIPRoutes = createRouteGroup('voipexp', '/voipexp', () => import('./VoipRouter'));

Meteor.startup(() => {
	console.log('Server started');
});
