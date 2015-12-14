FlowRouter.route('/live/:name', {
	name: 'live',

	action: function(params, queryParams) {
		console.log('action route livechat');
		Session.set('showUserInfo');
		openRoom('l', params.name);
	},

	triggersExit: [roomExit]
});

FlowRouter.route('/livechat-manager/departments', {
	name: 'livechat-departments',

	action: function(params, queryParams) {
		BlazeLayout.render('main', { center: 'pageContainer', pageTemplate: 'livechatDepartments', pageTitle: t('Departments') });
	}
});

FlowRouter.route('/livechat-manager/department/:_id?', {
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
