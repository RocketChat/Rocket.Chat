import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UseJoinRoomMutationFunctionProps = {
	rid: IRoom['_id'];
	reference: string;
	type: IRoom['t'];
};

export const useJoinRoom = () => {
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	// TODO(ddp-removal): /v1/channels.join only resolves public channels; non-`c`
	// rooms will error here (same as DDP `joinRoom` would, just via REST).
	// Replace with a unified `/v1/rooms.join` (or per-type endpoints) before
	// the 9.0.0 sweep removes the DDP method.
	const joinChannel = useEndpoint('POST', '/v1/channels.join');

	return useMutation({
		mutationFn: async ({ rid, reference, type }: UseJoinRoomMutationFunctionProps) => {
			await joinChannel({ roomId: rid });
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
