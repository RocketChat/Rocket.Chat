import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const MultiDeleteMessages = lazy(() => import('../../views/room/contextualBar/MultiDeleteMessages'));

export const useMultiDeleteMessagesRoomAction = (): RoomToolboxActionConfig | undefined => {
	return useMemo(() => {
		return {
			id: 'multi-delete-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Delete_message',
			icon: 'trash',
			disabled: true,
			order: 999,
			tabComponent: MultiDeleteMessages,
		};
	}, []);
};
