import { useSetting } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const CannedResponse = lazy(() => import('../cannedResponses/contextualBar/CannedResponse/WrapCannedResponseList'));

export const useCannedResponsesRoomAction = () => {
	const { data: licensed = false } = useHasLicenseModule('canned-responses');
	const enabled = useSetting('Canned_Responses_Enable', false);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!licensed || !enabled) {
			return undefined;
		}

		return {
			id: 'canned-responses',
			groups: ['live'],
			title: 'Canned_Responses',
			icon: 'canned-response',
			tabComponent: CannedResponse,
			order: 0,
		};
	}, [enabled, licensed]);
};
