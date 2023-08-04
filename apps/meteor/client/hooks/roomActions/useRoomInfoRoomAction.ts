import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const ChatsContextualBar = lazy(() => import('../../views/omnichannel/directory/chats/contextualBar/ChatsContextualBar'));

export const useRoomInfoRoomAction = () => {
	const enabled = useSetting('Menu_Room_Info', true);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'room-info',
			groups: ['live'],
			title: 'Room_Info',
			icon: 'info-circled',
			tabComponent: ChatsContextualBar,
			order: 0,
		};
	}, [enabled]);
};
