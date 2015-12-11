FlowRouter.route('/live/:name', {
	name: 'live',

	action: function(params, queryParams) {
		console.log('action route livechat');
		Session.set('showUserInfo');
		openRoom('l', params.name);
	},

	triggersExit: [roomExit]
});

livechatManagerRoutes = FlowRouter.group({
	prefix: '/livechat-manager',
	name: 'livechat-manager'
});

livechatManagerRoutes.route('/departments', {
	name: 'livechat-departments',

	action: function(params, queryParams) {
		BlazeLayout.render('main', { center: 'pageContainer', pageTemplate: 'livechatDepartments', pageTitle: t('Departments') });
	}
});

livechatManagerRoutes.route('/department/:_id?', {
	name: 'livechat-department',

	action: function(params, queryParams) {
		if (params._id) {
			pageTitle = t('Edit_Department');
		} else {
			pageTitle = t('New_Department');
		}
		BlazeLayout.render('main', { center: 'pageContainer', pageTemplate: 'livechatDepartmentForm', pageTitle: pageTitle});
	}
});

livechatManagerRoutes.route('/triggers', {
	name: 'livechat-triggers',

	action: function(params, queryParams) {
		BlazeLayout.render('main', { center: 'pageContainer', pageTemplate: 'livechatTriggers', pageTitle: t('Triggers') });
	}
});
