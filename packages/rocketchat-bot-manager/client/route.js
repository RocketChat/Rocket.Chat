FlowRouter.route('/admin/bots', {
	name: 'admin-bots',
	action() {
		return BlazeLayout.render('main', {
			center: 'adminBots',
			pageTitle: t('Bots')
		});
	}
});

FlowRouter.route('/admin/bots/:username', {
	name: 'admin-bots-username',
	action(params) {
		return BlazeLayout.render('main', {
			center: 'adminBotDetails',
			pageTitle: t('Bot_Details'),
			params
		});
	}
});
