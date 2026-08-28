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
					({ _updatedAt, createdAt, endedAt, users, ...rest }): VideoConference => ({
						...rest,
						_updatedAt: new Date(_updatedAt),
						createdAt: new Date(createdAt),
						endedAt: endedAt ? new Date(endedAt) : undefined,
						users: users.map(({ ts, joinedAt, declinedAt, leftAt, lastSeenAt, ringingAt, ...userRest }) => ({
							...userRest,
							ts: new Date(ts),
							joinedAt: joinedAt ? new Date(joinedAt) : undefined,
							declinedAt: declinedAt ? new Date(declinedAt) : undefined,
							leftAt: leftAt ? new Date(leftAt) : undefined,
							lastSeenAt: lastSeenAt ? new Date(lastSeenAt) : undefined,
							ringingAt: ringingAt ? new Date(ringingAt) : undefined,
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
