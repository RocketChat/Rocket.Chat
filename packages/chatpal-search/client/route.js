FlowRouter.route('/admin/chatpal-key', {
	name: 'admin-chatpal-key',
	action(p, up) {
		return BlazeLayout.render('main', {
			center: 'pageSettingsContainer',
			pageTitle: t('AdminChatpalKey'),
			pageTemplate: 'AdminChatpalKey'
		});
	}
});
