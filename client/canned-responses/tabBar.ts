import { useMemo } from 'react';

import { useHasLicense } from '../hooks/useHasLicense';
import { useSetting } from '../contexts/SettingsContext';
import { addAction } from '../views/room/lib/Toolbox';

addAction('canned-responses', () => {
	const hasLicense = useHasLicense('canned-responses');
	const enabled = useSetting('Canned_Responses_Enable');

	return useMemo(() => (hasLicense && enabled ? {
		groups: ['live'],
		id: 'canned-responses',
		title: 'Canned Responses',
		icon: 'canned-response',
		template: 'cannedResponses',
		order: 0,
	} : null), [hasLicense, enabled]);
});
