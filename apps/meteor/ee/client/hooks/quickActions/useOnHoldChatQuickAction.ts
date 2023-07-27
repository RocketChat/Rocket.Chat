import { useMemo } from 'react';

import { QuickActionsEnum, type QuickActionsActionConfig } from '../../../../client/views/room/lib/quickActions';
import { useHasLicenseModule } from '../useHasLicenseModule';

export const useOnHoldChatQuickAction = (): QuickActionsActionConfig | undefined => {
	const licensed = useHasLicenseModule('livechat-enterprise') === true;

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
