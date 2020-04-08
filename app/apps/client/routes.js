import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../ui-admin/client/routes';
import { Apps } from './orchestrator';

routes.route('/apps/what-is-it', {
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

routes.route('/apps', {
	name: 'apps',
	action: createAppsRouteAction('apps'),
});

routes.route('/apps/install', {
	name: 'app-install',
	action: createAppsRouteAction('appInstall'),
});

routes.route('/apps/:appId', {
	name: 'app-manage',
	action: createAppsRouteAction('appManage'),
});

routes.route('/apps/:appId/logs', {
	name: 'app-logs',
	action: createAppsRouteAction('appLogs'),
});

routes.route('/marketplace', {
	name: 'marketplace',
	action: createAppsRouteAction('marketplace'),
});

routes.route('/marketplace/:appId', {
	name: 'marketplace-app',
	action: createAppsRouteAction('appManage'),
});
