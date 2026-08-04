import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { teamsQueryKeys } from '../../../../../lib/queryKeys';
import { getConfig } from '../../../../../lib/utils/getConfig';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';

type TeamsChannelListOptions = {
	teamId: string;
	type: 'all' | 'autoJoin';
	text: string;
};

export const useTeamsChannelList = ({ teamId, type, text }: TeamsChannelListOptions) => {
	const listTeamRooms = useEndpoint('GET', '/v1/teams.listRooms');

	const count = parseInt(`${getConfig('teamsChannelListSize', 10)}`, 10);

	return useInfiniteQuery({
		queryKey: teamsQueryKeys.listChannels(teamId, { type, text }),
		queryFn: async ({ pageParam: offset }) => {
			const { rooms, total } = await listTeamRooms({
				teamId,
				offset,
				count,
				filter: text,
				type,
			});

			return {
				items: rooms.map(
					({ _updatedAt, lastMessage, lm, ts, webRtcCallStartTime, usersWaitingForE2EKeys, ...room }): IRoom => ({
						...(lm && { lm: new Date(lm) }),
						...(ts && { ts: new Date(ts) }),
						_updatedAt: new Date(_updatedAt),
						...(lastMessage && { lastMessage: mapMessageFromApi(lastMessage) }),
						...(webRtcCallStartTime && { webRtcCallStartTime: new Date(webRtcCallStartTime) }),
						...(usersWaitingForE2EKeys && {
							usersWaitingForE2EKeys: usersWaitingForE2EKeys?.map(({ userId, ts }) => ({ userId, ts: new Date(ts) })),
						}),
						...room,
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
			channels: pages.flatMap((page) => page.items),
			total: pages.at(-1)?.itemCount,
		}),
	});
};
