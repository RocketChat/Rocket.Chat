import type { IRoom, VideoConference } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../../../lib/queryKeys';

export const useVideoConfList = ({ roomId }: { roomId: IRoom['_id'] }) => {
	const getVideoConfs = useEndpoint('GET', '/v1/video-conference.list');

	const count = 25;

	return useInfiniteQuery({
		queryKey: videoConferenceQueryKeys.fromRoom(roomId),
		queryFn: async ({ pageParam: offset }) => {
			const { data, total } = await getVideoConfs({
				roomId,
				offset,
				count,
			});

			return {
				items: data.map(
					(videoConf): VideoConference => ({
						...videoConf,
						_updatedAt: new Date(videoConf._updatedAt),
						createdAt: new Date(videoConf.createdAt),
						endedAt: videoConf.endedAt ? new Date(videoConf.endedAt) : undefined,
						users: videoConf.users.map((user) => ({
							...user,
							ts: new Date(user.ts),
						})),
					}),
				),
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, _, lastOffset) => {
			const nextOffset = lastOffset + count;
			if (nextOffset >= lastPage.itemCount) return undefined;
			return nextOffset;
		},
		select: ({ pages }) => ({
			videoConfs: pages.flatMap((page) => page.items),
			total: pages.at(-1)?.itemCount,
		}),
	});
};
