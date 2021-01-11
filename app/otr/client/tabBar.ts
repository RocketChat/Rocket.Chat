import { useMemo, lazy, LazyExoticComponent, FC, useEffect } from 'react';

import { OTR } from './rocketchat.otr';
import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('otr', () => {
	const enabled = useSetting('OTR_Enable');

	const shouldAddAction = enabled && window.crypto;

	useEffect(() => {
		if (shouldAddAction) {
			OTR.crypto = window.crypto.subtle;
			OTR.enabled.set(true);
		} else {
			OTR.enabled.set(false);
		}
	}, [shouldAddAction]);

	return useMemo(() => (shouldAddAction
		? {
			groups: ['direct'],
			id: 'otr',
			title: 'OTR',
			icon: 'key',
			template: lazy(() => import('../../../client/views/room/contextualBar/OTR')) as LazyExoticComponent<FC>,
			order: 13,
			full: true,
		} : null), [shouldAddAction]);
});
