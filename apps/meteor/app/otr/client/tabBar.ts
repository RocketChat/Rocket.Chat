import { useMemo, lazy, useEffect } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

import OTR from './OTR';
import { ui } from '../../../client/lib/ui';

const template = lazy(() => import('../../../client/views/room/contextualBar/OTR'));

ui.addRoomAction('otr', (options) => {
	const room = options.room as unknown as ISubscription & IRoom;
	const federated = isRoomFederated(room);
	const enabled = useSetting('OTR_Enable') as boolean;

	const shouldAddAction = enabled && Boolean(global.crypto);

	useEffect(() => {
		OTR.setEnabled(shouldAddAction);
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
						...(federated && {
							'data-tooltip': 'OTR_unavailable_for_federation',
							'disabled': true,
						}),
				  }
				: null,
		[shouldAddAction, federated],
	);
});
