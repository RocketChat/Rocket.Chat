import { useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('pinned-messages', () => {
	const pinningAllowed = useSetting('Message_AllowPinning');
	return useMemo(
		() =>
			pinningAllowed
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'pinned-messages',
						title: 'Pinned_Messages',
						icon: 'pin',
						template: 'pinnedMessages',
						order: 11,
				  }
				: null,
		[pinningAllowed],
	);
});
