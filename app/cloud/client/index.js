import './admin/callback';
import './admin/cloud';
import './admin/cloudRegisterManually';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../ui-admin/client/routes';
import { AdminBox } from '../../ui-admin/client/AdminBox';
import { hasAtLeastOnePermission } from '../../authorization';

registerAdminRoute('/cloud', {
	name: 'cloud-config',
	async action() {
		await import('./admin');
		BlazeLayout.render('main', { center: 'cloud', old: true });
	},
});

registerAdminRoute('/cloud/oauth-callback', {
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
