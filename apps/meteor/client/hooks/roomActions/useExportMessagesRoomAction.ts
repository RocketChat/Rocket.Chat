import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const ExportMessages = lazy(() => import('../../views/room/contextualBar/ExportMessages'));

export const useExportMessagesRoomAction = () => {
	const room = useRoom();
	const permitted = usePermission('mail-messages', room._id);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!permitted) {
			return undefined;
		}

		return {
			id: 'export-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			anonymous: true,
			title: 'Export_Messages',
			icon: 'mail',
			tabComponent: ExportMessages,
			full: true,
			order: 12,
			type: 'communication',
		};
	}, [permitted]);
};
