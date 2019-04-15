import { TabBar } from '../../../ui-utils/client';

TabBar.removeButton('external-search');

TabBar.addButton({
	groups: ['channel', 'group', 'live'],
	id: 'assistify-ai',
	i18nTitle: 'Knowledge_Base',
	icon: 'lightbulb',
	template: 'AssistifySmarti',
	order: 0,
});

