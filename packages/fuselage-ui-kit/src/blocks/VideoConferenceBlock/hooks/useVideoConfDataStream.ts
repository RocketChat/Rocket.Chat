import type { IRoom } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useVideoConferenceInfo, videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export const useVideoConfDataStream = ({ rid, callId }: { rid: IRoom['_id']; callId: string }) => {
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
