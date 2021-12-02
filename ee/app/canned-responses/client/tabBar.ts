import { lazy, useMemo } from 'react';

import { useHasLicense } from '../../../client/hooks/useHasLicense';
import { useSetting } from '../../../../client/contexts/SettingsContext';
import { addAction } from '../../../../client/views/room/lib/Toolbox';

addAction('canned-responses', () => {
	const hasLicense = useHasLicense('canned-responses');
	const enabled = useSetting('Canned_Responses_Enable');

	return useMemo(() => (hasLicense && enabled ? {
		groups: ['live'],
		id: 'canned-responses',
		title: 'Canned_Responses',
		icon: 'canned-response',
		template: lazy(() => import('../../../client/omnichannel/components/contextualBar/CannedResponse')),
		order: 0,
	} : null), [hasLicense, enabled]);
});
