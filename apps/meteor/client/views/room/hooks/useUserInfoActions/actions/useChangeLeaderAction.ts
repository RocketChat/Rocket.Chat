import { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useMemo } from 'react';

import { usePermission } from '../../../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';

export const useChangeLeaderAction = (room: IRoom, user: Pick<IUser, '_id' | 'username'>): Action => {
	const t = useTranslation();
	const rid = room._id;
	const { _id: uid } = user;
	const userCanSetLeader = usePermission('set-leader', rid);
	const endpointPrefix = room.t === 'p' ? 'groups' : 'channels';

	const [roomCanSetLeader] = getRoomDirectives(room);
	const isLeader = useUserHasRoomRole(uid, rid, 'leader');
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeLeaderEndpoint = isLeader ? 'removeLeader' : 'addLeader';
	const changeLeaderMessage = isLeader
		? 'User__username__removed_from__room_name__leaders'
		: 'User__username__is_now_a_leader_of__room_name_';
	const changeLeader = useEndpointActionExperimental(
		'POST',
		`${endpointPrefix}.${changeLeaderEndpoint}`,
		// eslint-disable-next-line @typescript-eslint/camelcase
		t(changeLeaderMessage, { username: user.username, room_name: roomName }),
	);
	const changeLeaderAction = useMutableCallback(() => changeLeader({ roomId: rid, userId: uid }));
	const changeLeaderOption = useMemo(
		() =>
			roomCanSetLeader &&
			userCanSetLeader && {
				label: t(isLeader ? 'Remove_as_leader' : 'Set_as_leader'),
				icon: 'shield-alt',
				action: changeLeaderAction,
				checkOption: true,
				isChecked: isLeader,
			},
		[isLeader, roomCanSetLeader, t, userCanSetLeader, changeLeaderAction],
	);

	return changeLeaderOption;
};
