import { FlowRouter } from 'meteor/kadira:flow-router';
import { lazy } from 'react';

import { appLayout } from '../../../client/lib/appLayout';

const MainLayout = lazy(() => import('../../../client/views/root/MainLayout'));

FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action() {
		appLayout.render({ component: MainLayout, props: { center: 'snippetPage' } });
	},
});
