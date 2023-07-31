import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, usePermission, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

// TODO: Remove endpoint concatenation
export const useChangeLeaderAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const userCanSetLeader = usePermission('set-leader', rid);
	const userSubscription = useUserSubscription(rid);

	if (!room) {
		throw Error('Room not provided');
	}

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetLeader } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	const isLeader = useUserHasRoomRole(uid, rid, 'leader');

	const changeLeaderEndpoint = isLeader ? 'removeLeader' : 'addLeader';
	const changeLeaderMessage = isLeader ? 'removed__username__as__role_' : 'set__username__as__role_';
	const changeLeader = useEndpointAction('POST', `${endpointPrefix}.${changeLeaderEndpoint}`, {
		successMessage: t(changeLeaderMessage, { username: user.username, role: 'leader' }),
	});
	const changeLeaderAction = useMutableCallback(() => changeLeader({ roomId: rid, userId: uid }));
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
