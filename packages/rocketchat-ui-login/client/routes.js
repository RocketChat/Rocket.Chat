FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action() {
		BlazeLayout.render('loginLayout', {center: 'resetPassword'});
	}
});
