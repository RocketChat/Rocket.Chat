import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { routes } from '../../ui-admin/client/routes';
import { t } from '../../utils/client';

routes.route('/permissions', {
	name: 'admin-permissions',
	async action(/* params*/) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'permissions',
			pageTitle: t('Permissions'),
		});
	},
});

routes.route('/permissions/:name?/edit', {
	name: 'admin-permissions-edit',
	async action(/* params*/) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'pageContainer',
			pageTitle: t('Role_Editing'),
			pageTemplate: 'permissionsRole',
		});
	},
});

routes.route('/permissions/new', {
	name: 'admin-permissions-new',
	async action(/* params*/) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'pageContainer',
			pageTitle: t('Role_Editing'),
			pageTemplate: 'permissionsRole',
		});
	},
});
