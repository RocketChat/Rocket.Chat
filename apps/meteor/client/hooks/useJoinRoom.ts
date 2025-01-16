import type { IRoom } from '@rocket.chat/core-typings';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sdk } from '../../app/utils/client/lib/SDKClient';

export const useJoinRoom = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ rid, type }: { rid: IRoom['_id']; type: IRoom['t'] }) => {
			await sdk.call('joinRoom', rid);

			return { reference: rid, type };
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['rooms']);
		},
	});
};
