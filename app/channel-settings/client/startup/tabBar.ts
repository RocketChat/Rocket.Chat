import { lazy } from 'react';
import { addAction } from '../../../../client/channel/lib/Toolbox';

addAction('channel-settings', {
	groups: ['channel', 'group'],
	id: 'channel-settings',
	// anonymous: true,
	full: true,
	title: 'Room_Info',
	icon: 'info-circled',
	template: lazy(() => import('../../../../client/channel/ChannelInfo')),
	order: 7,
});
