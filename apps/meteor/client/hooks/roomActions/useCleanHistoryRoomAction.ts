import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const PruneMessages = lazy(() => import('../../views/room/contextualBar/PruneMessages'));

export const useCleanHistoryRoomAction = (): ToolboxActionConfig | undefined => {
	const room = useRoom();
	const federated = isRoomFederated(room);
	const permitted = usePermission('clean-channel-history', room._id);
	const { t } = useTranslation();

	return useMemo(() => {
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
			template: PruneMessages,
			order: 250,
		};
	}, [federated, permitted, t]);
};
