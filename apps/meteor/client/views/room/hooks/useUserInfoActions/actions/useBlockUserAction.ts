import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useMethod, useToastMessageDispatch, useUserId, useUserSubscription, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction } from '../useUserInfoActions';

export const useBlockUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useUserSubscription(rid);
	const ownUserId = useUserId();
	const { _id: uid } = user;
	const room = useUserRoom(rid);

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanBlock } = getRoomDirectives({ room, showingUserId: uid, userSubscription: currentSubscription });

	const isUserBlocked = currentSubscription?.blocker;
	const toggleBlock = useMethod(isUserBlocked ? 'unblockUser' : 'blockUser');

	const toggleBlockUserAction = useEffectEvent(async () => {
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
						content: t(isUserBlocked ? 'Unblock' : 'Block'),
						icon: 'ban' as const,
						onClick: toggleBlockUserAction,
					}
				: undefined,
		[isUserBlocked, ownUserId, roomCanBlock, t, toggleBlockUserAction, uid],
	);

	return toggleBlockUserOption;
};
