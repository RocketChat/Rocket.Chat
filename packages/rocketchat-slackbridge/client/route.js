FlowRouter.route('/account/slack/oauth/callback', {
	action(params, queryParams) {
		if (queryParams.hasOwnProperty('code')) {
			Meteor.call('requestSlackOAuthToken', queryParams.code);
		}

		FlowRouter.go('/account/slack');
	}
});
