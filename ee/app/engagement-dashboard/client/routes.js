import { HTML } from 'meteor/htmljs';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';


import { hasAllPermission } from '../../../../app/authorization';
import { AdminBox } from '../../../../app/ui-utils';
import { hasLicense } from '../../license/client';
import { createTemplateForComponent } from '../../../../client/createTemplateForComponent';


FlowRouter.route('/admin/engagement-dashboard/:tab?', {
	name: 'engagement-dashboard',
	action: async () => {
		const licensed = await hasLicense('engagement-dashboard');
		if (!licensed) {
			return;
		}

		const { EngagementDashboardRoute } = await import('./components/EngagementDashboardRoute');

		BlazeLayout.render('main', { center: await createTemplateForComponent(EngagementDashboardRoute,
			{},
			// eslint-disable-next-line new-cap
			() => HTML.DIV.call(null, { style: 'overflow: hidden; flex: 1 1 auto; height: 1%;' }),
			'engagement-dashboard'),
		});
	},
});

hasLicense('engagement-dashboard').then((enabled) => {
	if (!enabled) {
		return;
	}

	AdminBox.addOption({
		href: 'engagement-dashboard',
		i18nLabel: 'Engagement Dashboard',
		icon: 'file-keynote',
		permissionGranted: () => hasAllPermission('view-statistics'),
	});
}).catch((error) => {
	console.error('Error checking license.', error);
});
