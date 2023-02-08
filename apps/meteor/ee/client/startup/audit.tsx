import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { lazy } from 'react';

import { appLayout } from '../../../client/lib/appLayout';
import MainLayout from '../../../client/views/root/MainLayout';
import { onToggledFeature } from '../lib/onToggledFeature';

const AuditPage = lazy(() => import('../audit/AuditPage'));
const AuditLogPage = lazy(() => import('../views/audit/AuditLogPage'));

let auditRoute = FlowRouter.route('/audit', { name: 'audit-home' });
let auditLogRoute = FlowRouter.route('/audit-log', { name: 'audit-log' });

const registerRoutes = () => {
	FlowRouter._routes = FlowRouter._routes.filter((r) => r !== auditRoute && r !== auditLogRoute);
	if (auditRoute.name) {
		delete FlowRouter._routesMap[auditRoute.name];
	}
	if (auditLogRoute.name) {
		delete FlowRouter._routesMap[auditLogRoute.name];
	}

	auditRoute = FlowRouter.route('/audit', {
		name: 'audit-home',
		action() {
			appLayout.render(
				<MainLayout>
					<AuditPage />
				</MainLayout>,
			);
		},
	});

	auditLogRoute = FlowRouter.route('/audit-log', {
		name: 'audit-log',
		action() {
			appLayout.render(
				<MainLayout>
					<AuditLogPage />
				</MainLayout>,
			);
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
	up: async () => {
		await Promise.all([import('../../app/auditing/client/templates'), import('../../app/auditing/client/index.css')]);
		registerRoutes();
	},
	down: () => {
		unregisterRoutes();
	},
});
