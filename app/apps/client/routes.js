import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../client/admin';
import { Apps } from './orchestrator';

const createAppsRouteAction = (centerTemplate) => async () => {
	// TODO: render loading indicator
	if (await Apps.isEnabled()) {
		await import('./admin/views');
		BlazeLayout.render('main', { center: centerTemplate, old: true }); // TODO remove old
	} else {
		FlowRouter.go('admin-apps-disabled');
	}
};

registerAdminRoute('/apps', {
	name: 'apps',
	action: createAppsRouteAction('apps'),
});

registerAdminRoute('/apps/install', {
	name: 'app-install',
	action: createAppsRouteAction('appInstall'),
});

registerAdminRoute('/apps/:appId', {
	name: 'app-manage',
	action: createAppsRouteAction('appManage'),
});

registerAdminRoute('/apps/:appId/logs', {
	name: 'app-logs',
	action: createAppsRouteAction('appLogs'),
});
