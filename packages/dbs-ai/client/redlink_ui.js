RocketChat.TabBar.removeButton('external-search');

RocketChat.TabBar.addButton({
	groups: ['live', 'channel', 'request', 'expertise'],
	id: 'dbsai',
	i18nTitle: 'Knowledge_Base',
	icon: 'icon-lightbulb',
	template: 'dbsAI_smarti',
	order: 0,
	initialOpen: true
});

