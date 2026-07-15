import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { roomsQueryKeys } from '../lib/queryKeys';

type UseJoinRoomMutationFunctionProps = {
	rid: IRoom['_id'];
	reference: string;
	type: IRoom['t'];
};

export const useJoinRoom = () => {
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const joinChannel = useEndpoint('POST', '/v1/rooms.join');

	return useMutation({
		mutationFn: async ({ rid, reference, type }: UseJoinRoomMutationFunctionProps) => {
			await joinChannel({ roomId: rid });
			return { reference, type };
		},
		onSuccess: (data) => {
			// Prefix-match the open-room query key (roomsQueryKeys.roomReference) so the
			// "not subscribed" screen refetches and flips to the joined state without a reload.
			queryClient.invalidateQueries({
				queryKey: [...roomsQueryKeys.all, data.reference, data.type],
			});
		},
		onError: (error: unknown) => {
			dispatchToastMessage({ message: error, type: 'error' });
		},
	});
};
