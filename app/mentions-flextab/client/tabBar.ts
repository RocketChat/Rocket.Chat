import { addAction } from '../../../client/channel/lib/Toolbox';

addAction('mentions', {
	groups: ['channel', 'group'],
	id: 'mentions',
	title: 'Mentions',
	icon: 'at',
	template: 'mentionsFlexTab',
	order: 9,
});
