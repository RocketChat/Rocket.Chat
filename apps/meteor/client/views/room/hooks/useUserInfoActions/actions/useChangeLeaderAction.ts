import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	useTranslation,
	usePermission,
	useUserRoom,
	useUserSubscription,
	useEndpoint,
	useToastMessageDispatch,
} from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

const getEndpoint = (roomType: string, isLeader: boolean) => {
	if (roomType === 'p') {
		return isLeader ? '/v1/groups.removeLeader' : '/v1/groups.addLeader';
	}
	return isLeader ? '/v1/channels.removeLeader' : '/v1/channels.addLeader';
};

export const useChangeLeaderAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid, username } = user;
	const userCanSetLeader = usePermission('set-leader', rid);
	const userSubscription = useUserSubscription(rid);
	const dispatchToastMessage = useToastMessageDispatch();

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanSetLeader } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	const isLeader = useUserHasRoomRole(uid, rid, 'leader');

	const toggleLeaderEndpoint = useEndpoint('POST', getEndpoint(room.t, isLeader));

	const toggleOwnerMutation = useMutation({
		mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
			await toggleLeaderEndpoint({ roomId, userId });

			return t(isLeader ? 'removed__username__as__role_' : 'set__username__as__role_', { username, role: 'leader' });
		},
		onSuccess: (message) => {
			dispatchToastMessage({ type: 'success', message });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const changeLeaderAction = useEffectEvent(async () => toggleOwnerMutation.mutateAsync({ roomId: rid, userId: uid }));

	const changeLeaderOption = useMemo(
		() =>
			roomCanSetLeader && userCanSetLeader
				? {
						content: t(isLeader ? 'Remove_as_leader' : 'Set_as_leader'),
						icon: 'shield-alt' as const,
						onClick: changeLeaderAction,
						type: 'privileges' as UserInfoActionType,
					}
				: undefined,
		[isLeader, roomCanSetLeader, t, userCanSetLeader, changeLeaderAction],
	);

	return changeLeaderOption;
};
