import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useMethod, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { Action } from '../../../../hooks/useActionSpread';
import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

export const useBlockUserAction = (user: Pick<IUser, '_id' | 'username'>): Action | undefined => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useRoomSubscription();
	const ownUserId = useUserId();
	const { _id: uid } = user;
	const room = useRoom();

	const { roomCanBlock } = getRoomDirectives({ room, showingUserId: uid, userSubscription: currentSubscription });

	const isUserBlocked = currentSubscription?.blocker;
	const toggleBlock = useMethod(isUserBlocked ? 'unblockUser' : 'blockUser');

	const toggleBlockUserAction = useMutableCallback(async () => {
		try {
			await toggleBlock({ rid: room._id, blocked: uid });
			dispatchToastMessage({
				type: 'success',
				message: t(isUserBlocked ? 'User_is_unblocked' : 'User_is_blocked'),
			});
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const toggleBlockUserOption = useMemo(
		() =>
			roomCanBlock && uid !== ownUserId
				? {
						label: t(isUserBlocked ? 'Unblock' : 'Block'),
						icon: 'ban' as const,
						action: toggleBlockUserAction,
				  }
				: undefined,
		[isUserBlocked, ownUserId, roomCanBlock, t, toggleBlockUserAction, uid],
	);

	return toggleBlockUserOption;
};
