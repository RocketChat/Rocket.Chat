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
	class: 'livechat-manager',
	route: {
		name: 'livechat-manager',
		path: '/livechat-manager',
		action(params, queryParams) {
			Session.set('openedRoom');
			BlazeLayout.render('main', {
				center: 'pageContainer',
				pageTitle: t('Livechat_Manager'),
				pageTemplate: 'livechatManager'
			});
		}
	},
	permissions: ['view-livechat-manager']
});
