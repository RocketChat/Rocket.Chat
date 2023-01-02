import { lazy, useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../client/hooks/useHasLicenseModule';
import { addAction } from '../../../../client/views/room/lib/Toolbox';

addAction('canned-responses', () => {
	const hasLicense = useHasLicenseModule('canned-responses');
	const enabled = useSetting('Canned_Responses_Enable');

	return useMemo(
		() =>
			hasLicense && enabled
				? {
						groups: ['live'],
						id: 'canned-responses',
						title: 'Canned_Responses',
						icon: 'canned-response',
						template: lazy(() => import('../../../client/omnichannel/components/contextualBar/CannedResponse')),
						order: 0,
				  }
				: null,
		[hasLicense, enabled],
	);
});
