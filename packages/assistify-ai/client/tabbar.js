RocketChat.TabBar.removeButton('external-search');

RocketChat.TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'AssistifyAai',
	i18nTitle: 'Knowledge_Base',
	icon: 'lightbulb',
	template: 'AssistifySmarti',
	order: 15,
	initialOpen: true
});

