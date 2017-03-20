RocketChat.TabBar.removeButton('external-search');

RocketChat.TabBar.addButton({
	groups: ['live', 'channel'],
	id: 'external-search',
	i18nTitle: 'Knowledge_Base',
	icon: 'icon-lightbulb',
	template: 'dbsAI_externalSearch',
	order: 0,
	initialOpen: true
});

