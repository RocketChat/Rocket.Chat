import type { IRoom } from '@rocket.chat/core-typings';
import { usePermission, useSetting, useUserRoom } from '@rocket.chat/ui-contexts';

import { canRestrictMessageHistory } from '../../../../lib/rooms/canRestrictMessageHistory';

/** Whether the user can hide or restore members' earlier messages in this room: the same people who can add members to it. */
export const useCanManageMessageHistory = (rid: IRoom['_id']): boolean => {
	const room = useUserRoom(rid);
	const isEnabled = useSetting('Restricted_Message_History_Enabled', false);
	const canAddToJoinedRoom = usePermission('add-user-to-joined-room', rid);
	const canAddToAnyRoom = usePermission(room?.t === 'p' ? 'add-user-to-any-p-room' : 'add-user-to-any-c-room');

	return Boolean(isEnabled && room && canRestrictMessageHistory(room) && (canAddToJoinedRoom || canAddToAnyRoom));
};
