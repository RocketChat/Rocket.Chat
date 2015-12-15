RocketChat.roomTypes.add('l', 5, {
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
			return {
				name: sub.name
			}
		}
	},
	permissions: ['view-l-room']
});

AccountBox.addItem({
	name: 'Livechat',
	icon: 'icon-chat-empty',
	href: 'livechat-dashboard',
	sideNav: 'livechatFlex',
	permissions: ['view-livechat-manager'],
});
