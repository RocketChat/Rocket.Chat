import './admin/callback';
import './admin/cloud';
import './admin/cloudRegisterManually';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute, registerAdminSidebarItem } from '../../ui-admin/client';
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

registerAdminSidebarItem({
	icon: 'cloud-plus',
	href: 'admin/cloud',
	i18nLabel: 'Connectivity_Services',
	permissionGranted() {
		return hasAtLeastOnePermission(['manage-cloud']);
	},
});
