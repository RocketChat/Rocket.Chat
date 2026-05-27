import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sdk } from '../../app/utils/client/lib/SDKClient';

type UseJoinRoomMutationFunctionProps = {
	rid: IRoom['_id'];
	reference: string;
	type: IRoom['t'];
};

export const useJoinRoom = () => {
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const joinChannel = useEndpoint('POST', '/v1/channels.join');

	return useMutation({
		mutationFn: async ({ rid, reference, type }: UseJoinRoomMutationFunctionProps) => {
			if (type === 'c') {
				await joinChannel({ roomId: rid });
			} else {
				// /v1/channels.join only finds public channels; fall back to DDP for
				// other room types (private groups, DMs, livechat).
				await sdk.call('joinRoom', rid);
			}

			return { reference, type };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ['rooms', data],
			});
		},
		onError: (error: unknown) => {
			dispatchToastMessage({ message: error, type: 'error' });
		},
	});
};
