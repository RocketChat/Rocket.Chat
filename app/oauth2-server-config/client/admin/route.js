import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../ui-admin/client';
import { t } from '../../../utils';

registerAdminRoute('/oauth-apps', {
	name: 'admin-oauth-apps',
	async action() {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'oauthApps',
			pageTitle: t('OAuth_Applications'),
		});
	},
});

registerAdminRoute('/oauth-app/:id?', {
	name: 'admin-oauth-app',
	async action(params) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('OAuth_Application'),
			pageTemplate: 'oauthApp',
			params,
		});
	},
});
