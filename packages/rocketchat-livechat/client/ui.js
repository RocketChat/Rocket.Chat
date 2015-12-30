RocketChat.roomTypes.add('l', 5, {
	template: 'livechat',
	icon: 'icon-chat-empty',
	route: {
		name: 'live',
		path: '/live/:name',
		action: (params, queryParams) => {
			Session.set('showUserInfo');
			openRoom('l', params.name);
			RocketChat.TabBar.showGroup('livechat', 'search');
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
	href: 'livechat-users',
	sideNav: 'livechatFlex',
	permissions: ['view-livechat-manager'],
});

RocketChat.TabBar.addButton({
	groups: ['livechat'],
	id: 'visitor-info',
	i18nTitle: 'Visitor_Info',
	icon: 'icon-chat',
	template: 'visitorInfo',
	order: 0
});

RocketChat.TabBar.addGroup('message-search', ['livechat']);
RocketChat.TabBar.addGroup('starred-messages', ['livechat']);
RocketChat.TabBar.addGroup('uploaded-files-list', ['livechat']);
