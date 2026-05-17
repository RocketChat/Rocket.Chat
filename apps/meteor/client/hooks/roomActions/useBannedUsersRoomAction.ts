import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { usePermission } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';

const BannedUsers = lazy(() => import('../../views/room/contextualBar/BannedUsers'));

export const useBannedUsersRoomAction = () => {
	const room = useRoom();

	const hasPermissionToBan = usePermission('ban-user', room._id);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!hasPermissionToBan) {
			return undefined;
		}

		return {
			id: 'banned-users',
			groups: ['channel', 'group', 'team'],
			title: 'Banned_Users',
			icon: 'ban',
			tabComponent: BannedUsers,
			order: 13,
			type: 'moderation',
		};
	}, [hasPermissionToBan]);
};
