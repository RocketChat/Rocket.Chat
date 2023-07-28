import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const ExportMessages = lazy(() => import('../../views/room/contextualBar/ExportMessages'));

export const useExportMessagesRoomAction = (): ToolboxActionConfig | undefined => {
	const room = useRoom();
	const permitted = usePermission('mail-messages', room._id);

	return useMemo(() => {
		if (!permitted) {
			return undefined;
		}

		return {
			id: 'export-messages',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			anonymous: true,
			title: 'Export_Messages',
			icon: 'mail',
			template: ExportMessages,
			full: true,
			order: 12,
		};
	}, [permitted]);
};
