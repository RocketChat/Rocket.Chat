import type { IRoom } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useVideoConferenceInfo, type VideoConferenceInfo, videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useVideoConfDataStream = ({
	rid,
	callId,
}: {
	rid: IRoom['_id'];
	callId: string;
}): UseQueryResult<VideoConferenceInfo, Error> => {
	const queryClient = useQueryClient();

	const subscribeNotifyRoom = useStream('notify-room');

	useEffect(
		() =>
			subscribeNotifyRoom(
				`${rid}/videoconf`,
				(id) =>
					id === callId &&
					queryClient.invalidateQueries({
						queryKey: videoConferenceInfoQueryKey(callId),
					}),
			),
		[rid, callId, subscribeNotifyRoom, queryClient],
	);

	return useVideoConferenceInfo(callId);
};
