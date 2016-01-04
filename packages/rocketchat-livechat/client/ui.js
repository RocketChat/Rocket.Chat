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
	condition: () => {
		return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
	}
});

AccountBox.addItem({
	name: 'Livechat',
	icon: 'icon-chat-empty',
	href: 'livechat-users',
	sideNav: 'livechatFlex',
	condition: () => {
		return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-livechat-manager');
	},
});
