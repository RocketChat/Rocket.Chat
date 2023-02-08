import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { addAction } from '../../views/room/lib/Toolbox';

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
						template: lazy(() => import('../../views/room/contextualBar/PinnedMessagesTab')),
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
