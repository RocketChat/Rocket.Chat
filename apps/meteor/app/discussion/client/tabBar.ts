import { useMemo, lazy } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { addAction } from '../../../client/views/room/lib/Toolbox';

const template = lazy(() => import('../../../client/views/room/contextualBar/Discussions'));

addAction('discussions', ({ room }) => {
	const discussionEnabled = useSetting('Discussion_enabled');
	const federated = isRoomFederated(room);

	return useMemo(
		() =>
			discussionEnabled && !room.prid
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'discussions',
						title: 'Discussions',
						icon: 'discussion',
						template,
						full: true,
						...(federated && {
							'disabled': true,
							'data-tooltip': 'Discussions_unavailable_for_federation',
						}),
						order: 3,
				  }
				: null,
		[discussionEnabled, room.prid, federated],
	);
});
