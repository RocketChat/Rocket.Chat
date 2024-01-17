import { useMemo } from 'react';

import { QuickActionsEnum, type QuickActionsActionConfig } from '../../views/room/lib/quickActions';

export const useChatForwardQuickAction = (): QuickActionsActionConfig => {
	return useMemo(
		() => ({
			groups: ['live'],
			id: QuickActionsEnum.ChatForward,
			title: 'Forward_chat',
			icon: 'balloon-arrow-top-right',
			order: 2,
		}),
		[],
	);
};
