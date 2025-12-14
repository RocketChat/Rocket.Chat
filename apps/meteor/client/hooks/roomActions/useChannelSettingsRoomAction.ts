import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

const Info = lazy(() => import('../../views/room/contextualBar/Info'));

export const useChannelSettingsRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'channel-settings',
			groups: ['channel', 'group'],
			anonymous: true,
			full: true,
			title: 'Room_Info',
			icon: 'info-circled',
			tabComponent: Info,
			order: 1,
		}),
		[],
	);
};
