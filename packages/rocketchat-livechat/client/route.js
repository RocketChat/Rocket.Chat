FlowRouter.route('/live/:name', {
	name: 'live',

	action: function(params, queryParams) {
		console.log('action route livechat');
		Session.set('showUserInfo');
		openRoom('l', params.name);
	},

	triggersExit: [roomExit]
});
