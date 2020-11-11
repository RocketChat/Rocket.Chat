import { addAction } from '../../../client/channel/lib/Toolbox';

addAction('starred-messages', {
	groups: ['channel', 'group', 'direct'],
	id: 'starred-messages',
	title: 'Starred_Messages',
	icon: 'star',
	template: 'starredMessages',
	order: 10,
});
