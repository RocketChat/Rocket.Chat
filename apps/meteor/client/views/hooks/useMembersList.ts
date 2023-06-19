import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

type MembersListOptions = {
	rid: string;
	type: 'all' | 'online';
	limit: number;
	debouncedText: string;
	roomType: 'd' | 'p' | 'c';
};

const endpointsByRoomType = {
	d: '/v1/im.members',
	p: '/v1/groups.members',
	c: '/v1/channels.members',
} as const;

export const useMembersList = (options: MembersListOptions) => {
	const getMembers = useEndpoint('GET', endpointsByRoomType[options.roomType]);

	return useInfiniteQuery(
		[options.roomType, 'members', options.rid, options.type, options.debouncedText],
		async ({ pageParam }) => {
			const start = pageParam ?? 0;

			return getMembers({
				roomId: options.rid,
				offset: start,
				count: 20,
				...(options.debouncedText && { filter: options.debouncedText }),
				...(options.type !== 'all' && { status: [options.type] }),
			});
		},
		{
			getNextPageParam: (lastPage) => {
				const offset = lastPage.offset + lastPage.count;
				// if the offset is greater than the total, return undefined to stop the query from trying to fetch another page
				return offset >= lastPage.total ? undefined : offset;
			},
		},
	);
};
