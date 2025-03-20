import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useHasLicenseModule } from '../useHasLicenseModule';

const CannedResponse = lazy(() => import('../../omnichannel/cannedResponses/contextualBar/CannedResponse/WrapCannedResponseList'));

export const useCannedResponsesRoomAction = () => {
	const licensed = useHasLicenseModule('canned-responses') === true;
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
