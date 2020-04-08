import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../../ui-admin/client/routes';
import { t } from '../../../utils';

routes.route('/oauth-apps', {
	name: 'admin-oauth-apps',
	async action() {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'oauthApps',
			pageTitle: t('OAuth_Applications'),
		});
	},
});

routes.route('/oauth-app/:id?', {
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
