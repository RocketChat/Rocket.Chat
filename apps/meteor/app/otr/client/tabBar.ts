import { useMemo, lazy, useEffect } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { OTR } from './rocketchat.otr';
import { addAction } from '../../../client/views/room/lib/Toolbox';

const template = lazy(() => import('../../../client/views/room/contextualBar/OTR'));

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

	return useMemo(
		() =>
			shouldAddAction
				? {
						groups: ['direct'],
						id: 'otr',
						title: 'OTR',
						icon: 'stopwatch',
						template,
						order: 13,
						full: true,
				  }
				: null,
		[shouldAddAction],
	);
});
