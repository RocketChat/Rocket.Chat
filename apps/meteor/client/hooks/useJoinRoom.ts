import type { IRoom } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
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

	return useMutation({
		mutationFn: async ({ rid, reference, type }: UseJoinRoomMutationFunctionProps) => {
			await sdk.call('joinRoom', rid);

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
