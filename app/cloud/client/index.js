import './admin/callback';
import './admin/cloud';
import './admin/cloudRegisterManually';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../ui-admin/client/routes';
import { AdminBox } from '../../ui-utils';
import { hasAtLeastOnePermission } from '../../authorization';

routes.route('/cloud', {
	name: 'cloud-config',
	async action() {
		await import('./admin');
		BlazeLayout.render('main', { center: 'cloud', old: true });
	},
});

routes.route('/cloud/oauth-callback', {
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
