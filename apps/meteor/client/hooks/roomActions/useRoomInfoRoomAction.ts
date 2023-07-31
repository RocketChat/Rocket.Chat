import { lazy, useMemo } from 'react';

import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const ChatsContextualBar = lazy(() => import('../../views/omnichannel/directory/chats/contextualBar/ChatsContextualBar'));

export const useRoomInfoRoomAction = (): ToolboxActionConfig => {
	return useMemo(
		() => ({
			id: 'room-info',
			groups: ['live'],
			title: 'Room_Info',
			icon: 'info-circled',
			template: ChatsContextualBar,
			order: 0,
		}),
		[],
	);
};
