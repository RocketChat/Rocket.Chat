import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const CallsContextualBarRoom = lazy(() => import('../../views/omnichannel/directory/calls/contextualBar/CallsContextualBarRoom'));

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
