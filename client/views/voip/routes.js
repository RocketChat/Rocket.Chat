import { Meteor } from 'meteor/meteor';

import { createRouteGroup } from '../../lib/createRouteGroup';

export const registerVoIPRoutes = createRouteGroup('voip', '/voip', () => import('./VoIPRouter'));

Meteor.startup(() => {});
