import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const Info = lazy(() => import('../../views/room/contextualBar/Info'));

export const useChannelSettingsRoomAction = () => {
	const room = useRoom();

	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'channel-settings',
			groups: ['channel', 'group', 'team'],
			anonymous: true,
			full: true,
			title: room.teamMain ? 'Team_Info' : 'Room_Info',
			icon: 'info-circled',
			tabComponent: Info,
			order: 1,
		}),
		[room.teamMain],
	);
};
