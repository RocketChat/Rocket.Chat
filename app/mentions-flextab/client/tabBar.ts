import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('mentions', {
	groups: ['channel', 'group', 'team'],
	id: 'mentions',
	title: 'Mentions',
	icon: 'at',
	template: 'mentionsFlexTab',
	order: 9,
});
