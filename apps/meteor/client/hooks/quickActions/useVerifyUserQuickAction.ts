import { useMemo } from 'react';

import { QuickActionsEnum, type QuickActionsActionConfig } from '../../views/room/lib/quickActions';

export const useVerifyUserQuickAction = (): QuickActionsActionConfig => {
	return useMemo(
		() => ({
			groups: ['live'],
			id: QuickActionsEnum.VerifyUser,
			title: 'Verify_User',
			icon: 'shield-alt',
			order: 6,
		}),
		[],
	);
};
