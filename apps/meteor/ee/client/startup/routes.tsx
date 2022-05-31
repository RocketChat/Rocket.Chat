import { FlowRouter } from 'meteor/kadira:flow-router';
import React from 'react';

import { appLayout, BlazeTemplate, MainLayout } from '../../../client/lib/appLayout';

FlowRouter.route('/audit', {
	name: 'audit-home',
	action() {
		appLayout.render(
			<MainLayout>
				<BlazeTemplate template='auditPage' />
			</MainLayout>,
		);
	},
});

FlowRouter.route('/audit-log', {
	name: 'audit-log',
	action() {
		appLayout.render(
			<MainLayout>
				<BlazeTemplate template='auditLogPage' />
			</MainLayout>,
		);
	},
});
