<<<<<<< HEAD
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../../client/admin';
=======
import { registerAdminRoute } from '../../../ui-admin/client';
>>>>>>> 5c22a19... Wip on custom sounds refactor

registerAdminRoute('/custom-sounds/:context?', {
	name: 'custom-sounds',
	lazyRouteComponent: () => import('./AdminSoundsRoute'),
});
