import { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useMethod, useToastMessageDispatch, useUserId, useUserSubscription, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

export const useBlockUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useUserSubscription(rid);
	const ownUserId = useUserId();
	const { _id: uid } = user;
	const room = useUserRoom(rid);

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanBlock } = getRoomDirectives(room);

	const isUserBlocked = currentSubscription?.blocker;
	const toggleBlock = useMethod(isUserBlocked ? 'unblockUser' : 'blockUser');

	const toggleBlockUserAction = useMutableCallback(async () => {
		try {
			await toggleBlock({ rid, blocked: uid });
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
						icon: 'ban',
						action: toggleBlockUserAction,
				  }
				: undefined,
		[isUserBlocked, ownUserId, roomCanBlock, t, toggleBlockUserAction, uid],
	);

	return toggleBlockUserOption;
};
