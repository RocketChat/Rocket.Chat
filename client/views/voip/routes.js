import { Meteor } from 'meteor/meteor';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerVoIPRoutes = createRouteGroup('voipexp', '/voipexp', () => import('./VoIPRouter'));

Meteor.startup(() => {});
