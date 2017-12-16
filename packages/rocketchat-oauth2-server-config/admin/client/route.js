FlowRouter.route('/admin/oauth-apps', {
	name: 'admin-oauth-apps',
	action() {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('OAuth_Applications'),
			pageTemplate: 'oauthApps'
		});
	}
});

FlowRouter.route('/admin/oauth-app/:id?', {
	name: 'admin-oauth-app',
	action(params) {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('OAuth_Application'),
			pageTemplate: 'oauthApp',
			params
		});
	}
});
