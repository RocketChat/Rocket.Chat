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

export const useChangeModeratorAction = (room: IRoom, user: Pick<IUser, '_id' | 'username'>): Action => {
	const t = useTranslation();
	const rid = room._id;
	const { _id: uid } = user;

	const userCanSetModerator = usePermission('set-moderator', rid);
	const isModerator = useUserHasRoomRole(uid, rid, 'moderator');
	const endpointPrefix = room.t === 'p' ? 'groups' : 'channels';

	const [roomCanSetModerator] = getRoomDirectives(room);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeModeratorEndpoint = isModerator ? 'removeModerator' : 'addModerator';
	const changeModeratorMessage = isModerator
		? 'User__username__removed_from__room_name__moderators'
		: 'User__username__is_now_a_moderator_of__room_name_';
	const changeModerator = useEndpointActionExperimental(
		'POST',
		`${endpointPrefix}.${changeModeratorEndpoint}`,
		// eslint-disable-next-line @typescript-eslint/camelcase
		t(changeModeratorMessage, { username: user.username, room_name: roomName }),
	);
	const changeModeratorAction = useMutableCallback(() => changeModerator({ roomId: rid, userId: uid }));
	const changeModeratorOption = useMemo(
		() =>
			roomCanSetModerator &&
			userCanSetModerator && {
				label: t(isModerator ? 'Remove_as_moderator' : 'Set_as_moderator'),
				icon: 'shield',
				action: changeModeratorAction,
				checkOption: true,
				isChecked: isModerator,
			},
		[changeModeratorAction, isModerator, roomCanSetModerator, t, userCanSetModerator],
	);

	return changeModeratorOption;
};
