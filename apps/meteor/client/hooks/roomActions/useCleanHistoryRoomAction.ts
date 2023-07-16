import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';

const PruneMessages = lazy(() => import('../../views/room/contextualBar/PruneMessages'));

export const useCleanHistoryRoomAction = () => {
	const room = useRoom();
	const federated = isRoomFederated(room);
	const permitted = usePermission('clean-channel-history', room._id);
	const { t } = useTranslation();

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
				tooltip: t('core.Clean_History_unavailable_for_federation'),
				disabled: true,
			}),
			template: PruneMessages,
			order: 250,
		});
	}, [federated, permitted, t]);
};
