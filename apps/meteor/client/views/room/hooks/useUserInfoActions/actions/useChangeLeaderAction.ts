import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import type { Action } from '../../../../hooks/useActionSpread';
import { useRoom } from '../../../contexts/RoomContext';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';

// TODO: Remove endpoint concatenation
export const useChangeLeaderAction = (user: Pick<IUser, '_id' | 'username'>): Action | undefined => {
	const t = useTranslation();
	const room = useRoom();
	const { _id: uid } = user;
	const userCanSetLeader = usePermission('set-leader', room._id);
	const userSubscription = useUserSubscription(room._id);

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetLeader } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	const isLeader = useUserHasRoomRole(uid, room._id, 'leader');
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeLeaderEndpoint = isLeader ? 'removeLeader' : 'addLeader';
	const changeLeaderMessage = isLeader
		? 'User__username__removed_from__room_name__leaders'
		: 'User__username__is_now_a_leader_of__room_name_';
	const changeLeader = useEndpointAction('POST', `${endpointPrefix}.${changeLeaderEndpoint}`, {
		successMessage: t(changeLeaderMessage, { username: user.username, room_name: roomName }),
	});
	const changeLeaderAction = useMutableCallback(() => changeLeader({ roomId: room._id, userId: uid }));
	const changeLeaderOption = useMemo(
		() =>
			roomCanSetLeader && userCanSetLeader
				? {
						label: t(isLeader ? 'Remove_as_leader' : 'Set_as_leader'),
						icon: 'shield-alt' as const,
						action: changeLeaderAction,
				  }
				: undefined,
		[isLeader, roomCanSetLeader, t, userCanSetLeader, changeLeaderAction],
	);

	return changeLeaderOption;
};
