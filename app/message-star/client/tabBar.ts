import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('starred-messages', {
	groups: ['channel', 'group', 'direct', 'team', 'ephemeral'],
	id: 'starred-messages',
	title: 'Starred_Messages',
	icon: 'star',
	template: 'starredMessages',
	order: 10,
});
