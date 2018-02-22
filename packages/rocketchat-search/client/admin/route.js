FlowRouter.route('/admin/Search', {
	name: 'admin-search',
	action() {
		return BlazeLayout.render('main', {
			center: 'SearchAdmin',
			pageTitle: t('Search')
		});
	}
});
