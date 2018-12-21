import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.route('/admin/cloud', {
	name: 'config',
	action() {
		BlazeLayout.render('main', { center: 'cloud', old: true });
	},
});

FlowRouter.route('/admin/cloud/oauth-callback', {
	name: 'oauth-callback',
	action() {
		BlazeLayout.render('main', { center: 'callback', old: true });
	},
});

RocketChat.AdminBox.addOption({
	icon: 'cloud-plus',
	href: 'admin/cloud',
	i18nLabel: 'Cloud',
	permissionGranted() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-cloud']);
	},
});
