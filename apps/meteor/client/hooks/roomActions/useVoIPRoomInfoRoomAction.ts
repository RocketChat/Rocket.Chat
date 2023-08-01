import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const CallsContextualBarRoom = lazy(() => import('../../views/omnichannel/directory/calls/contextualBar/CallsContextualBarRoom'));

export const useVoIPRoomInfoRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'voip-room-info',
			groups: ['voip'],
			title: 'Call_Information',
			icon: 'info-circled',
			template: CallsContextualBarRoom,
			order: 0,
		}),
		[],
	);
};
