import type { IRoom } from '@rocket.chat/core-typings';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import type { AppPreventedError } from '../lib/errors/AppPreventedError';
import { dispatchToastMessage } from '../lib/toast';

type UseJoinRoomMutationFunctionProps = {
	rid: IRoom['_id'];
	reference: string;
	type: IRoom['t'];
};

const isAppError = (error: AppPreventedError | Error): error is AppPreventedError => (error as AppPreventedError).reason !== undefined;

export const useJoinRoom = () => {
	const queryClient = useQueryClient();

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
		onError: (error: AppPreventedError | Error) => {
			dispatchToastMessage({ message: isAppError(error) ? error.reason : error.message, type: 'error' });
		},
	});
};
