import type { IRoom } from '@rocket.chat/core-typings';
import { getNextPageOffset } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../../../lib/queryKeys';
import { mapVideoConfFromApi } from '../../../../../lib/utils/mapVideoConfFromApi';

export const useVideoConfList = ({ roomId }: { roomId: IRoom['_id'] }) => {
	const getVideoConfs = useEndpoint('GET', '/v1/video-conference.list');

	const count = 25;

	return useInfiniteQuery({
		queryKey: videoConferenceQueryKeys.fromRoom(roomId),
		queryFn: async ({ pageParam: offset }) => {
			const { data, ...page } = await getVideoConfs({
				roomId,
				offset,
				count,
			});

			return {
				items: data.map(mapVideoConfFromApi),
				...page,
			};
		},
		initialPageParam: 0,
		getNextPageParam: getNextPageOffset,
		select: ({ pages }) => ({
			videoConfs: pages.flatMap((page) => page.items),
			total: pages.at(-1)?.total,
		}),
	});
};
