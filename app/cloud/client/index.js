import './admin/callback';
import './admin/cloud';
import './admin/cloudRegisterManually';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { AdminBox } from '../../ui-utils';
import { hasAtLeastOnePermission } from '../../authorization';

FlowRouter.route('/admin/cloud', {
	name: 'cloud-config',
	async action() {
		await import('./admin');
		BlazeLayout.render('main', { center: 'cloud', old: true });
	},
});

FlowRouter.route('/admin/cloud/oauth-callback', {
	name: 'cloud-oauth-callback',
	async action() {
		await import('./admin');
		BlazeLayout.render('main', { center: 'cloudCallback', old: true });
	},
});

AdminBox.addOption({
	icon: 'cloud-plus',
	href: 'admin/cloud',
	i18nLabel: 'Connectivity_Services',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-cloud']);
	},
});
