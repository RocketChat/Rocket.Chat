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
export const useChangeModeratorAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;

	const userCanSetModerator = usePermission('set-moderator', rid);
	const isModerator = useUserHasRoomRole(uid, rid, 'moderator');

	if (!room) {
		throw Error('Room not provided');
	}

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetModerator } = getRoomDirectives(room);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeModeratorEndpoint = isModerator ? 'removeModerator' : 'addModerator';
	const changeModeratorMessage = isModerator
		? 'User__username__removed_from__room_name__moderators'
		: 'User__username__is_now_a_moderator_of__room_name_';
	const changeModerator = useEndpointActionExperimental(
		'POST',
		`${endpointPrefix}.${changeModeratorEndpoint}`,
		t(changeModeratorMessage, { username: user.username, room_name: roomName }),
	);
	const changeModeratorAction = useMutableCallback(() => changeModerator({ roomId: rid, userId: uid }));
	const changeModeratorOption = useMemo(
		() =>
			roomCanSetModerator && userCanSetModerator
				? {
						label: t(isModerator ? 'Remove_as_moderator' : 'Set_as_moderator'),
						icon: 'shield-blank',
						action: changeModeratorAction,
				  }
				: undefined,
		[changeModeratorAction, isModerator, roomCanSetModerator, t, userCanSetModerator],
	);

	return changeModeratorOption;
};
