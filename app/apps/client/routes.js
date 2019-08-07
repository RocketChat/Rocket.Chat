import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../authorization';
import { Apps } from './orchestrator';

Meteor.startup(() => {
	Tracker.autorun((c) => {
		if (!hasPermission('manage-apps')) {
			return;
		}
		import('./admin');
		c.stop();
		FlowRouter.route('/admin/apps/what-is-it', {
			name: 'apps-what-is-it',
			action: async () => {
				// TODO: render loading indicator
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
				BlazeLayout.render('main', { center: centerTemplate, old: true }); // TODO remove old
			} else {
				FlowRouter.go('apps-what-is-it');
			}
		};

		FlowRouter.route('/admin/apps', {
			name: 'apps',
			action: createAppsRouteAction('apps'),
		});

		FlowRouter.route('/admin/apps/install', {
			name: 'app-install',
			action: createAppsRouteAction('appInstall'),
		});

		FlowRouter.route('/admin/apps/:appId', {
			name: 'app-manage',
			action: createAppsRouteAction('appManage'),
		});

		FlowRouter.route('/admin/apps/:appId/logs', {
			name: 'app-logs',
			action: createAppsRouteAction('appLogs'),
		});

		FlowRouter.route('/admin/marketplace', {
			name: 'marketplace',
			action: createAppsRouteAction('marketplace'),
		});

		FlowRouter.route('/admin/marketplace/:appId', {
			name: 'marketplace-app',
			action: createAppsRouteAction('appManage'),
		});
	});
});
