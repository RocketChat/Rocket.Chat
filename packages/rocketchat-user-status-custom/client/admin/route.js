FlowRouter.route('/admin/user-status-custom', {
	name: 'user-status-custom',
	action(/*params*/) {
		BlazeLayout.render('main', {center: 'adminUserStatus'});
	}
});
