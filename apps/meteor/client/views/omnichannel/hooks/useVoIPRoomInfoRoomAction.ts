import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

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
