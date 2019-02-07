import './admin/callback';
import './admin/cloud';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.route('/admin/cloud', {
	name: 'cloud-config',
	action() {
		BlazeLayout.render('main', { center: 'cloud', old: true });
	},
});

FlowRouter.route('/admin/cloud/oauth-callback', {
	name: 'cloud-oauth-callback',
	action() {
		BlazeLayout.render('main', { center: 'cloudCallback', old: true });
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
