FlowRouter.route('/reset-password/:token', {
	name: 'resetPassword',
	action: function() {
		BlazeLayout.render('loginLayout', {center: 'resetPassword'});
	}
});
