import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { t } from 'meteor/rocketchat:utils';

FlowRouter.route('/admin/permissions', {
	name: 'admin-permissions',
	action(/* params*/) {
		return BlazeLayout.render('main', {
			center: 'pageContainer',
			pageTitle: t('Permissions'),
			pageTemplate: 'permissions',
		});
	},
});

FlowRouter.route('/admin/permissions/:name?/edit', {
	name: 'admin-permissions-edit',
	action(/* params*/) {
		return BlazeLayout.render('main', {
			center: 'pageContainer',
			pageTitle: t('Role_Editing'),
			pageTemplate: 'permissionsRole',
		});
	},
});

FlowRouter.route('/admin/permissions/new', {
	name: 'admin-permissions-new',
	action(/* params*/) {
		return BlazeLayout.render('main', {
			center: 'pageContainer',
			pageTitle: t('Role_Editing'),
			pageTemplate: 'permissionsRole',
		});
	},
});
