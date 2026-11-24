import type { IRoom, ISubscription, IUser, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint, useUserRoom } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useCanManageMessageHistory } from './useCanManageMessageHistory';
import { roomsQueryKeys } from '../../../lib/queryKeys';

/**
 * A member's history cutoff in the room, read only for people who can change it.
 * `null` when the member sees the full history, `undefined` while it isn't known.
 */
export const useMemberHistoryVisibleFrom = (
	rid: IRoom['_id'],
	username: IUser['username'],
): Serialized<ISubscription>['historyVisibleFrom'] | null | undefined => {
	const room = useUserRoom(rid);
	const canManage = useCanManageMessageHistory(rid);
	const getMembers = useEndpoint('GET', '/v1/rooms.membersOrderedByRole');

	const { data } = useQuery({
		queryKey: roomsQueryKeys.memberHistoryVisibleFrom(rid, room?.t ?? 'c', username ?? ''),
		queryFn: async () => {
			const { members } = await getMembers({ roomId: rid, filter: username, count: 100 });
			const member = members.find((member) => member.username === username);
			return member ? { historyVisibleFrom: member.subscription.historyVisibleFrom ?? null } : null;
		},
		enabled: canManage && Boolean(room && username),
	});

	return data ? data.historyVisibleFrom : undefined;
};
