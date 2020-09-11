import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { registerAdminRoute } from '../../../client/admin';
import { t } from '../../utils/client';
import { createTemplateForComponent } from '../../../client/reactAdapters';

createTemplateForComponent('newRole', () => import('../../../client/admin/permissions/NewRolePage'));
createTemplateForComponent('editRole', () => import('../../../client/admin/permissions/EditRolePage'));

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
			center: 'editRole',
			// pageTitle: t('Role_Editing'),
			// pageTemplate: 'permissionsRole',
		});
	},
});

registerAdminRoute('/permissions/new', {
	name: 'admin-permissions-new',
	async action(/* params*/) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'newRole',
			// pageTitle: t('Role_Editing'),
			// pageTemplate: 'permissionsRole',
		});
	},
});
