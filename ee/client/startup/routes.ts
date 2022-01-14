import { FlowRouter } from 'meteor/kadira:flow-router';
import { lazy } from 'react';

import { appLayout } from '../../../client/lib/appLayout';

const MainLayout = lazy(() => import('../../../client/views/root/MainLayout'));

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		appLayout.render({ component: MainLayout, props: { center: 'auditPage' } });
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		appLayout.render({ component: MainLayout, props: { center: 'auditLogPage' } });
	},
});
