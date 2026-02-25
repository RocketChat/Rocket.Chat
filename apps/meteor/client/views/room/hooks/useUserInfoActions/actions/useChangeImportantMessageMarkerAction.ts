import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	usePermission,
	useUserRoom,
	useUserSubscription,
	useToastMessageDispatch,
} from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

export const useChangeImportantMessageMarkerAction = (
	user: Pick<IUser, '_id'>,
	rid: IRoom['_id'],
): UserInfoAction | undefined => {
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const userCanSetImportantMessageMarker = usePermission('set-important-message-marker', rid);
	const userSubscription = useUserSubscription(rid);
	const dispatchToastMessage = useToastMessageDispatch();

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanSetImportantMessageMarker } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	const initialHasRole = useUserHasRoomRole(uid, rid, 'important-message-marker');
	const [hasRole, setHasRole] = useState(initialHasRole);

	const changeRoleAction = useEffectEvent(async () => {
		// TODO: Implement API call when endpoints are ready
		setHasRole(!hasRole);
		
		dispatchToastMessage({ 
			type: 'success', 
			message: hasRole 
				? 'Removed ability to mark important messages (demo mode)' 
				: 'Granted ability to mark important messages (demo mode)'
		});
	});

	const changeRoleOption = useMemo(
		() =>
			roomCanSetImportantMessageMarker && userCanSetImportantMessageMarker
				? {
						content: hasRole ? 'Remove ability to mark important messages' : 'Grant ability to mark important messages',
						icon: 'flag' as const,
						onClick: changeRoleAction,
						type: 'privileges' as UserInfoActionType,
					}
				: undefined,
		[hasRole, roomCanSetImportantMessageMarker, userCanSetImportantMessageMarker, changeRoleAction],
	);

	return changeRoleOption;
};
