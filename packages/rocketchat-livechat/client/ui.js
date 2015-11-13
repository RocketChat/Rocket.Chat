Meteor.startup(function() {
	RocketChat.roomTypes.add('l', {
		template: 'livechat',
		icon: 'icon-chat-empty',
		route: {
			name: 'live',
			path: '/live/:name',
			action: (params, queryParams) => {
				Session.set('showUserInfo');
				openRoom('l', params.name);
			},
			link: (sub) => {
				return { name: sub.name }
			}
		},
		permissions: [ 'view-livechat' ]
	});

	AccountBox.addOption({ name: 'Livechat', icon: 'icon-chat-empty', class: 'livechat-manager', roles: ['livechat-manager'] });
});
