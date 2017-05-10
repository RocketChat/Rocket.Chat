FlowRouter.route('/account/slack/oauth/callback', {
	action: function(params, queryParams) {
		if (queryParams.hasOwnProperty('code')) {
			Meteor.call('requestSlackOAuthToken', queryParams.code);
		}

		FlowRouter.go('/account/slack');
	}
});
