import type { IUser, RequiredField } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { roomsQueryKeys } from '../../lib/queryKeys';

export type BannedUser = RequiredField<Pick<IUser, '_id' | 'username' | 'name'>, '_id' | 'username'>;

type UseRoomBannedUsersProps = {
	rid: string;
	limit?: number;
	enabled?: boolean;
};

export const useRoomBannedUsers = ({ rid, limit = 50, enabled = true }: UseRoomBannedUsersProps) => {
	const getBannedUsers = useEndpoint('GET', '/v1/rooms.bannedUsers');

	return useInfiniteQuery({
		queryKey: roomsQueryKeys.bannedUsers(rid),
		queryFn: async ({ pageParam }) => {
			const start = pageParam ?? 0;

			return getBannedUsers({
				roomId: rid,
				count: limit,
				offset: start,
			});
		},
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset >= lastPage.total ? undefined : offset;
		},

		select: ({ pages }) => ({
			total: pages[pages.length - 1].total,
			bannedUsers: pages.flatMap((page) => page.bannedUsers) || [],
		}),
		initialPageParam: 0,
		enabled,
	});
};
