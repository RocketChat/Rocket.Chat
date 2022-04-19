import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('remind-messages', {
	groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
	id: 'remind-messages',
	title: 'Remind_Message',
	icon: 'clock',
	template: 'remindMessages',
	order: 10,
});
