import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Template } from 'meteor/templating';

import { hasAllPermission } from '../../../../app/authorization';
import { AdminBox } from '../../../../app/ui-utils';
import { hasLicense } from '../../license/client';

Template.EngagementDashboardRoute = new Blaze.Template('EngagementDashboardRoute',
	() => HTML.DIV.call(null, { style: 'overflow: hidden; flex: 1 1 auto; height: 1%;' }));

Template.EngagementDashboardRoute.onRendered(async function() {
	const [
		{ createElement },
		{ render, unmountComponentAtNode },
		{ MeteorProvider },
		{ EngagementDashboardRoute },
	] = await Promise.all([
		import('react'),
		import('react-dom'),
		import('../../../../client/providers/MeteorProvider'),
		import('./components/EngagementDashboardRoute'),
	]);

	const container = this.firstNode;

	if (!container) {
		return;
	}

	this.autorun(() => {
		const routeName = FlowRouter.getRouteName();
		if (routeName !== 'engagement-dashboard') {
			unmountComponentAtNode(container);
		}
	});

	render(createElement(MeteorProvider, { children: createElement(EngagementDashboardRoute) }), container);
});

let licensed = false;

FlowRouter.route('/admin/engagement-dashboard/:tab?', {
	name: 'engagement-dashboard',
	action: () => {
		if (!licensed) {
			return;
		}

		BlazeLayout.render('main', { center: 'EngagementDashboardRoute' });
	},
});

hasLicense('engagement-dashboard').then((enabled) => {
	if (!enabled) {
		return;
	}

	licensed = true;

	AdminBox.addOption({
		href: 'engagement-dashboard',
		i18nLabel: 'Engagement Dashboard',
		icon: 'file-keynote',
		permissionGranted: () => hasAllPermission('view-statistics'),
	});
}).catch((error) => {
	console.error('Error checking license.', error);
});
