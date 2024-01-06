import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const MarkedAsDoneMessagesTab = lazy(() => import('../../views/room/contextualBar/MarkedAsDoneMessagesTab'));

export const useMarkedAsDoneMessagesRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'marked-as-done-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Done',
			icon: 'checkmark-circled',
			tabComponent: MarkedAsDoneMessagesTab,
			order: 0,
			type: 'organization',
		}),
		[],
	);
};
