RocketChat.TabBar.removeButton('external-search');

RocketChat.TabBar.addButton({
	groups: ['livechat', 'channel'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'icon-lightbulb',
	template: 'reisebuddy_externalSearch',
	order: 0,
	initialOpen: true
});

