import { isRoomNativeFederated } from '@rocket.chat/core-typings';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import * as Federation from '../../lib/federation/Federation';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';

const BannedUsers = lazy(() => import('../../views/room/contextualBar/BannedUsers'));

export const useBannedUsersRoomAction = () => {
	const room = useRoom();
	const user = useUser();
	const subscription = useRoomSubscription();

	const hasPermissionToBan = usePermission('ban-user', room._id);

	const federationCanBan = isRoomNativeFederated(room) && Federation.isEditableByTheUser(user || undefined, room, subscription);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!hasPermissionToBan || !federationCanBan) {
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
	}, [federationCanBan, hasPermissionToBan]);
};
