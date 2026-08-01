import type { IRoom, VideoConferenceWithDiscussion } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';

// Hoisted so react-query can reuse the previous select result — an inline arrow is a new function
// identity every render, which makes query-core re-run select and hand back a fresh array each time.
const selectVideoConfs = ({ pages }: { pages: { items: VideoConferenceWithDiscussion[]; itemCount: number }[] }) => ({
	videoConfs: pages.flatMap((page) => page.items),
	total: pages.at(-1)?.itemCount,
});

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
					({ discussionLastMessage, ...videoConf }): VideoConferenceWithDiscussion => ({
						...videoConf,
						_updatedAt: new Date(videoConf._updatedAt),
						createdAt: new Date(videoConf.createdAt),
						endedAt: videoConf.endedAt ? new Date(videoConf.endedAt) : undefined,
						users: videoConf.users.map((user) => ({
							...user,
							ts: new Date(user.ts),
						})),
						...(discussionLastMessage && { discussionLastMessage: mapMessageFromApi(discussionLastMessage) }),
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
		select: selectVideoConfs,
	});
};
