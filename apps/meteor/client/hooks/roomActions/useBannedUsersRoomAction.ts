import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
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

	if (!room) {
		throw new Error('error-invalid-room');
	}

	if (!user) {
		throw new Error('error-user-not-found');
	}

	const hasPermissionToBan = usePermission('ban-user', room._id);
	const userCanBan = isRoomFederated(room)
		? isRoomNativeFederated(room) && Federation.isEditableByTheUser(user || undefined, room, subscription)
		: hasPermissionToBan;

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!userCanBan) {
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
	}, [userCanBan]);
};
