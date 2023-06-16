import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import React, { lazy } from 'react';

import { hasAllPermission } from '../../../app/authorization/client';
import { appLayout } from '../../../client/lib/appLayout';
import NotAuthorizedPage from '../../../client/views/notAuthorized/NotAuthorizedPage';
import MainLayout from '../../../client/views/root/MainLayout';
import { onToggledFeature } from '../lib/onToggledFeature';

const AuditPage = lazy(() => import('../views/audit/AuditPage'));
const AuditLogPage = lazy(() => import('../views/audit/AuditLogPage'));

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'audit-home': {
			pathname: '/audit';
			pattern: '/audit/:tab?';
		};
		'audit-log': {
			pathname: '/audit-log';
			pattern: '/audit-log';
		};
	}
}

let auditRoute = FlowRouter.route('/audit/:tab?', { name: 'audit-home' });
let auditLogRoute = FlowRouter.route('/audit-log', { name: 'audit-log' });

const registerRoutes = () => {
	FlowRouter._routes = FlowRouter._routes.filter((r) => r !== auditRoute && r !== auditLogRoute);
	if (auditRoute.name) {
		delete FlowRouter._routesMap[auditRoute.name];
	}
	if (auditLogRoute.name) {
		delete FlowRouter._routesMap[auditLogRoute.name];
	}

	auditRoute = FlowRouter.route('/audit/:tab?', {
		name: 'audit-home',
		action() {
			Tracker.autorun(() => {
				const canAudit = hasAllPermission('can-audit');

				appLayout.render(<MainLayout>{canAudit ? <AuditPage /> : <NotAuthorizedPage />}</MainLayout>);
			});
		},
	});

	auditLogRoute = FlowRouter.route('/audit-log', {
		name: 'audit-log',
		action() {
			Tracker.autorun(() => {
				const canAuditLog = hasAllPermission('can-audit-log');

				appLayout.render(<MainLayout>{canAuditLog ? <AuditLogPage /> : <NotAuthorizedPage />}</MainLayout>);
			});
		},
	});

	if (FlowRouter._initialized) {
		FlowRouter._updateCallbacks();
		FlowRouter.reload();
	}
};

const unregisterRoutes = () => {
	FlowRouter._routes = FlowRouter._routes.filter((r) => r !== auditRoute && r !== auditLogRoute);
	if (auditRoute.name) {
		delete FlowRouter._routesMap[auditRoute.name];
	}
	if (auditLogRoute.name) {
		delete FlowRouter._routesMap[auditLogRoute.name];
	}

	if (FlowRouter._initialized) {
		FlowRouter._updateCallbacks();
		FlowRouter.reload();
	}
};

onToggledFeature('auditing', {
	up: () => {
		registerRoutes();
	},
	down: () => {
		unregisterRoutes();
	},
});
