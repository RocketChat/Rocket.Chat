import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { t } from '../../utils/client';

import './startup';

FlowRouter.route('/admin/permissions', {
	name: 'admin-permissions',
	async action(/* params*/) {
		await import('./views');
		return BlazeLayout.render('main', {
			center: 'permissions',
			pageTitle: t('Permissions'),
		});
	},
});

FlowRouter.route('/admin/permissions/:name?/edit', {
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

FlowRouter.route('/admin/permissions/new', {
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
