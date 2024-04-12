import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';

import * as Federation from '../../../../../lib/federation/Federation';
import { useRoomSubscription } from '../../../contexts/RoomContext';

export const useCanEditRoom = (room: IRoom) => {
	const user = useUser();
	const subscription = useRoomSubscription();

	const hasPermissionToEdit = usePermission('edit-room', room._id);
	const isFederated = isRoomFederated(room);
	const canEdit =
		user && isFederated ? Federation.isEditableByTheUser(user, room, subscription) && hasPermissionToEdit : hasPermissionToEdit;

	return canEdit;
};
