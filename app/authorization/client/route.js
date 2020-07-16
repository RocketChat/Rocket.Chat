import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../client/admin';
import { t } from '../../utils/client';

registerAdminRoute('/permissions', {
	name: 'admin-permissions',
	async action(/* params*/) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'permissions',
			pageTitle: t('Permissions'),
		});
	},
});

registerAdminRoute('/permissions/:name?/edit', {
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

registerAdminRoute('/permissions/new', {
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
