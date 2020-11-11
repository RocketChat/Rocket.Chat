import { addAction } from '../../../../client/channel/lib/Toolbox';

addAction('channel-settings', {
	groups: ['channel', 'group'],
	id: 'channel-settings',
	// anonymous: true,
	title: 'Room_Info',
	icon: 'info-circled',
	template: 'channelSettings',
	order: 7,
});
