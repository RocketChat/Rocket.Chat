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
					(videoConf): VideoConference =>
						// REST layer returns dates as ISO strings; the in-memory
						// model uses Date objects. Reify here so consumers can
						// rely on Date methods. New embedded-SFU fields
						// (participants/recording/transcription/transcript/summary)
						// follow the same pattern.
						({
							...videoConf,
							_updatedAt: new Date(videoConf._updatedAt),
							createdAt: new Date(videoConf.createdAt),
							endedAt: videoConf.endedAt ? new Date(videoConf.endedAt) : undefined,
							users: videoConf.users.map((user) => ({
								...user,
								ts: new Date(user.ts),
							})),
							...(videoConf.participants
								? {
										participants: videoConf.participants.map((p) => ({
											...p,
											joinedAt: p.joinedAt ? new Date(p.joinedAt) : undefined,
											leftAt: p.leftAt ? new Date(p.leftAt) : undefined,
										})),
									}
								: {}),
							...(videoConf.recording
								? {
										recording: {
											...videoConf.recording,
											startedAt: new Date(videoConf.recording.startedAt),
											endedAt: videoConf.recording.endedAt ? new Date(videoConf.recording.endedAt) : undefined,
										},
									}
								: {}),
							...(videoConf.transcription
								? {
										transcription: {
											...videoConf.transcription,
											startedAt: videoConf.transcription.startedAt ? new Date(videoConf.transcription.startedAt) : undefined,
											endedAt: videoConf.transcription.endedAt ? new Date(videoConf.transcription.endedAt) : undefined,
										},
									}
								: {}),
							...(videoConf.transcript
								? {
										transcript: videoConf.transcript.map((t) => ({
											...t,
											startedAt: new Date(t.startedAt),
											endedAt: t.endedAt ? new Date(t.endedAt) : undefined,
										})),
									}
								: {}),
							...(videoConf.summary ? { summary: { ...videoConf.summary, generatedAt: new Date(videoConf.summary.generatedAt) } } : {}),
						}) as VideoConference,
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
