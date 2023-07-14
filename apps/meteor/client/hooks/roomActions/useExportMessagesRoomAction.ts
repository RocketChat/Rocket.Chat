import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';

const ExportMessages = lazy(() => import('../../views/room/contextualBar/ExportMessages'));

export const useExportMessagesRoomAction = () => {
	const room = useRoom();
	const permitted = usePermission('mail-messages', room._id);

	useEffect(() => {
		if (!permitted) {
			return;
		}

		return ui.addRoomAction('export-messages', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			id: 'export-messages',
			anonymous: true,
			title: 'Export_Messages',
			icon: 'mail',
			template: ExportMessages,
			full: true,
			order: 12,
		});
	}, [permitted]);
};
