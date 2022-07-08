import { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';

// TODO: Remove endpoint concatenation
export const useChangeLeaderAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const userCanSetLeader = usePermission('set-leader', rid);

	if (!room) {
		throw Error('Room not provided');
	}

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetLeader } = getRoomDirectives(room);
	const isLeader = useUserHasRoomRole(uid, rid, 'leader');
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeLeaderEndpoint = isLeader ? 'removeLeader' : 'addLeader';
	const changeLeaderMessage = isLeader
		? 'User__username__removed_from__room_name__leaders'
		: 'User__username__is_now_a_leader_of__room_name_';
	const changeLeader = useEndpointActionExperimental(
		'POST',
		`${endpointPrefix}.${changeLeaderEndpoint}`,
		t(changeLeaderMessage, { username: user.username, room_name: roomName }),
	);
	const changeLeaderAction = useMutableCallback(() => changeLeader({ roomId: rid, userId: uid }));
	const changeLeaderOption = useMemo(
		() =>
			roomCanSetLeader && userCanSetLeader
				? {
						label: t(isLeader ? 'Remove_as_leader' : 'Set_as_leader'),
						icon: 'shield-alt',
						action: changeLeaderAction,
				  }
				: undefined,
		[isLeader, roomCanSetLeader, t, userCanSetLeader, changeLeaderAction],
	);

	return changeLeaderOption;
};
