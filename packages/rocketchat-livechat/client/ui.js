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
	href: 'livechat-manager',
	sideNav: 'livechatFlex',
	permissions: ['view-livechat-manager'],
});

AccountBox.addRoute({
	name: 'livechat-manager',
	path: '/livechat-manager',
	sideNav: 'livechatFlex',
	pageTitle: t('Livechat_Manager'),
	pageTemplate: 'livechatManager'
});
