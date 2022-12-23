import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import type { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';

// TODO: Remove endpoint concatenation
export const useChangeOwnerAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const userCanSetOwner = usePermission('set-owner', rid);
	const isOwner = useUserHasRoomRole(uid, rid, 'owner');

	if (!room) {
		throw Error('Room not provided');
	}

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetOwner } = getRoomDirectives(room);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeOwnerEndpoint = isOwner ? 'removeOwner' : 'addOwner';
	const changeOwnerMessage = isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_an_owner_of__room_name_';

	const changeOwner = useEndpointActionExperimental(
		'POST',
		`${endpointPrefix}.${changeOwnerEndpoint}`,
		t(changeOwnerMessage, { username: user.username, room_name: roomName }),
	);

	const changeOwnerAction = useMutableCallback(async () => changeOwner({ roomId: rid, userId: uid }));
	const changeOwnerOption = useMemo(
		() =>
			roomCanSetOwner && userCanSetOwner
				? {
						label: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
						icon: 'shield-check',
						action: changeOwnerAction,
				  }
				: undefined,
		[changeOwnerAction, roomCanSetOwner, userCanSetOwner, isOwner, t],
	);

	return changeOwnerOption;
};
