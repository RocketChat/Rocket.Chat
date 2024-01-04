import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const PruneMessages = lazy(() => import('../../views/room/contextualBar/PruneMessages'));

export const useCleanHistoryRoomAction = () => {
	const room = useRoom();
	const federated = isRoomFederated(room);
	const permitted = usePermission('clean-channel-history', room._id);
	const { t } = useTranslation();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!permitted) {
			return undefined;
		}

		return {
			id: 'clean-history',
			groups: ['channel', 'group', 'team', 'direct_multiple', 'direct'],
			full: true,
			title: 'Prune_Messages',
			icon: 'eraser',
			...(federated && {
				tooltip: t('core.Clean_History_unavailable_for_federation'),
				disabled: true,
			}),
			tabComponent: PruneMessages,
			order: 250,
			type: 'customization',
		};
	}, [federated, permitted, t]);
};
