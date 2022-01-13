import { lazy } from 'react';

import { appLayout } from '../../../client/lib/appLayout';
import { registerAdminRoute } from '../../../client/views/admin';

const MainLayout = lazy(() => import('../../../client/views/root/MainLayout'));

registerAdminRoute('/chatpal', {
	name: 'chatpal-admin',
	action() {
		appLayout.render({ component: MainLayout, props: { center: 'ChatpalAdmin' } });
	},
});
