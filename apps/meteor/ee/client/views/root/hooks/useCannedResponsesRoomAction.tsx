import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { ui } from '../../../../../client/lib/ui';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const CannedResponse = lazy(() => import('../../../omnichannel/components/contextualBar/CannedResponse'));

export const useCannedResponsesRoomAction = () => {
	const licensed = useHasLicenseModule('canned-responses') === true;
	const enabled = useSetting('Canned_Responses_Enable', false);

	useEffect(() => {
		if (!licensed || !enabled) {
			return;
		}

		return ui.addRoomAction('canned-responses', () => {
			return {
				groups: ['live'],
				id: 'canned-responses',
				title: 'Canned_Responses',
				icon: 'canned-response',
				template: CannedResponse,
				order: 0,
			};
		});
	}, [enabled, licensed]);
};
