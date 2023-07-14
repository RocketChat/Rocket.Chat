import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';

const PruneMessages = lazy(() => import('../../views/room/contextualBar/PruneMessages'));

export const useCleanHistoryRoomAction = () => {
	const room = useRoom();
	const federated = isRoomFederated(room);
	const permitted = usePermission('clean-channel-history', room._id);

	useEffect(() => {
		if (!permitted) {
			return;
		}

		return ui.addRoomAction('clean-history', {
			groups: ['channel', 'group', 'team', 'direct_multiple', 'direct'],
			id: 'clean-history',
			full: true,
			title: 'Prune_Messages',
			icon: 'eraser',
			...(federated && {
				'data-tooltip': 'Clean_History_unavailable_for_federation',
				'disabled': true,
			}),
			template: PruneMessages,
			order: 250,
		});
	}, [federated, permitted]);
};
