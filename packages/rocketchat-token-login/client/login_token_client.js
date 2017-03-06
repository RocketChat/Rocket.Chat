Meteor.loginWithLoginToken = function(token) {
	Accounts.callLoginMethod({
		methodArguments: [{
			loginToken: token
		}],
		userCallback: function(error) {
			if (!error) {
				FlowRouter.go('/');
			}
		}
	});
};

FlowRouter.route('/login-token/:token', {
	name: 'tokenLogin',
	action: function() {
		BlazeLayout.render('loginLayout');
		Meteor.loginWithLoginToken(this.getParam('token'));
	}
});
