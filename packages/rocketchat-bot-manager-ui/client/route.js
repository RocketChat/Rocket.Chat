FlowRouter.route('/admin/bots', {
	name: 'admin-bots',
	action() {
		return BlazeLayout.render('main', {
			center: 'adminBots',
			pageTitle: t('Bots')
		});
	}
});
