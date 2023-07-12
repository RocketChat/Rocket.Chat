import { lazy, useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { ui } from '../../../../client/lib/ui';

const template = lazy(() => import('./ExternalFrameContainer'));

ui.addRoomAction('omnichannel-external-frame', () => {
	const enabled = useSetting('Omnichannel_External_Frame_Enabled');

	return useMemo(
		() =>
			enabled
				? {
						groups: ['live'],
						id: 'omnichannel-external-frame',
						title: 'Omnichannel_External_Frame',
						icon: 'cube',
						template,
						order: -1,
				  }
				: null,
		[enabled],
	);
});
