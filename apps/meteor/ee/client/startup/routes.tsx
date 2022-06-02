import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { lazy } from 'react';

import { appLayout } from '../../../client/lib/appLayout';
import MainLayout from '../../../client/views/root/MainLayout';

const AuditPage = lazy(() => import('../audit/AuditPage'));
const AuditLogPage = lazy(() => import('../audit/AuditLogPage'));

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		appLayout.render(
			<MainLayout>
				<AuditPage />
			</MainLayout>,
		);
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		appLayout.render(
			<MainLayout>
				<AuditLogPage />
			</MainLayout>,
		);
	},
});
