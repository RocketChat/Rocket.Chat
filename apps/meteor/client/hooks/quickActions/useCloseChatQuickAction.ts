import { useMemo } from 'react';

import { QuickActionsEnum, type QuickActionsActionConfig } from '../../views/room/lib/quickActions';

export const useCloseChatQuickAction = (): QuickActionsActionConfig => {
	return useMemo(
		() => ({
			groups: ['live'],
			id: QuickActionsEnum.CloseChat,
			title: 'End_conversation',
			icon: 'balloon-close-top-right',
			order: 5,
			color: 'danger',
		}),
		[],
	);
};
