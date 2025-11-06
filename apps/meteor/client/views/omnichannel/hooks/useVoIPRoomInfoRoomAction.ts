import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../room/contexts/RoomToolboxContext';

const CallsContextualBarRoom = lazy(() => import('../directory/calls/contextualBar/CallsContextualBarRoom'));

export const useVoIPRoomInfoRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'voip-room-info',
			groups: ['voip'],
			title: 'Call_Information',
			icon: 'info-circled',
			tabComponent: CallsContextualBarRoom,
			order: 0,
		}),
		[],
	);
};
