import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../client/admin';
import { Apps } from './orchestrator';

registerAdminRoute('/apps/what-is-it', {
	name: 'apps-what-is-it',
	action: async () => {
		// TODO: render loading indicator
		await import('./admin/views');
		if (await Apps.isEnabled()) {
			FlowRouter.go('apps');
		} else {
			BlazeLayout.render('main', { center: 'appWhatIsIt' });
		}
	},
});

const createAppsRouteAction = (centerTemplate) => async () => {
	// TODO: render loading indicator
	if (await Apps.isEnabled()) {
		await import('./admin/views');
		BlazeLayout.render('main', { center: centerTemplate, old: true }); // TODO remove old
	} else {
		FlowRouter.go('apps-what-is-it');
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

registerAdminRoute('/marketplace', {
	name: 'marketplace',
	action: createAppsRouteAction('marketplace'),
});

registerAdminRoute('/marketplace/:appId', {
	name: 'marketplace-app',
	action: createAppsRouteAction('appManage'),
});
