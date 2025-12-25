import { useMemo } from 'react';

import { QuickActionsEnum, type QuickActionsActionConfig } from '../../views/room/lib/quickActions';
import { useHasLicenseModule } from '../useHasLicenseModule';

export const useOnHoldChatQuickAction = (): QuickActionsActionConfig | undefined => {
	const { data: licensed = false } = useHasLicenseModule('livechat-enterprise');

	return useMemo(() => {
		if (!licensed) {
			return undefined;
		}

		return {
			groups: ['live'],
			id: QuickActionsEnum.OnHoldChat,
			title: 'Omnichannel_onHold_Chat',
			icon: 'pause-unfilled',
			order: 4,
		};
	}, [licensed]);
};
