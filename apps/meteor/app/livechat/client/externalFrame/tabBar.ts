import { useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../../client/views/room/lib/Toolbox';

addAction('omnichannel-external-frame', () => {
	const enabled = useSetting('Omnichannel_External_Frame_Enabled');

	return useMemo(
		() =>
			enabled
				? {
						groups: ['live'],
						id: 'omnichannel-external-frame',
						title: 'Omnichannel_External_Frame',
						icon: 'cube',
						template: 'ExternalFrameContainer',
						order: -1,
				  }
				: null,
		[enabled],
	);
});
