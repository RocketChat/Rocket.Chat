import { useMemo } from 'react';

import { QuickActionsEnum, type QuickActionsActionConfig } from '../../views/room/lib/quickActions';

export const useMoveQueueQuickAction = (): QuickActionsActionConfig => {
	return useMemo(
		() => ({
			groups: ['live'],
			id: QuickActionsEnum.MoveQueue,
			title: 'Move_queue',
			icon: 'burger-arrow-left',
			order: 1,
		}),
		[],
	);
};
