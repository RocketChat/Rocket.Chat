import { useMemo } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('pinned-messages', ({ room }) => {
	const pinningAllowed = useSetting('Message_AllowPinning');
	const federated = isRoomFederated(room);
	return useMemo(
		() =>
			pinningAllowed
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'pinned-messages',
						title: 'Pinned_Messages',
						icon: 'pin',
						template: 'pinnedMessages',
						...(federated && {
							'data-tooltip': 'Pinned_messages_unavailable_for_federation',
							'disabled': true,
						}),
						order: 11,
				  }
				: null,
		[pinningAllowed, federated],
	);
});
