import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const Info = lazy(() => import('../../views/room/contextualBar/Info'));

export const useChannelSettingsRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('channel-settings', {
			groups: ['channel', 'group'],
			id: 'channel-settings',
			anonymous: true,
			full: true,
			title: 'Room_Info',
			icon: 'info-circled',
			template: Info,
			order: 1,
		});
	}, []);
};
