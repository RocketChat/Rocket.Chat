import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import * as Federation from '../../../../../lib/federation/Federation';
import { useRoomSubscription } from '../../../contexts/RoomContext';

export const useCanEditRoom = (room: IRoom) => {
	const user = useUser();
	const subscription = useRoomSubscription();

	const isFederated = isRoomFederated(room);
	const hasPermissionToEdit = usePermission('edit-room', room._id);
	const canEditTeam = usePermission('edit-team-channel', room._id);

	return useMemo(() => {
		if (room.teamMain) {
			return canEditTeam;
		}

		return user && isFederated ? Federation.isEditableByTheUser(user, room, subscription) && hasPermissionToEdit : hasPermissionToEdit;
	}, [canEditTeam, hasPermissionToEdit, user, subscription, room, isFederated]);
};
