import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';

import { IRoom } from '../../../../../../definition/IRoom';
import { IUser } from '../../../../../../definition/IUser';
import { useMethod } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserId, useUserSubscription } from '../../../../../contexts/UserContext';
import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

export const useBlockUserAction = (room: IRoom, user: Pick<IUser, '_id' | 'username'>): Action => {
	const t = useTranslation();
	const rid = room._id;
	const { _id: uid } = user;
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useUserSubscription(rid);
	const ownUserId = useUserId();
	const [roomCanBlock] = getRoomDirectives(room);

	const isUserBlocked = currentSubscription?.blocker;
	const toggleBlock = useMethod(isUserBlocked ? 'unblockUser' : 'blockUser');

	const toggleBlockUserAction = useMutableCallback(async () => {
		try {
			await toggleBlock({ rid, blocked: uid });
			dispatchToastMessage({
				type: 'success',
				message: t(isUserBlocked ? 'User_is_unblocked' : 'User_is_blocked'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const toggleBlockUserOption = useMemo(
		() =>
			roomCanBlock &&
			uid !== ownUserId && {
				label: t(isUserBlocked ? 'Unblock' : 'Block'),
				icon: 'ban',
				action: toggleBlockUserAction,
			},
		[isUserBlocked, ownUserId, roomCanBlock, t, toggleBlockUserAction, uid],
	);

	return toggleBlockUserOption;
};
