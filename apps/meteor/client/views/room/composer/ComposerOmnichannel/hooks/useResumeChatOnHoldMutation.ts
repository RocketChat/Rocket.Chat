import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useResumeChatOnHoldMutation = (
	options?: Omit<UseMutationOptions<void, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<void, Error, IRoom['_id']> => {
	const resumeChatOnHold = useEndpoint('POST', '/v1/livechat/room.resumeOnHold');

	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	return useMutation(
		async (roomId) => {
			await resumeChatOnHold({ roomId });
		},
		{
			...options,
			onSuccess: async (data, rid, context) => {
				await queryClient.invalidateQueries(['current-chats']);
				await queryClient.invalidateQueries(['rooms', rid]);
				await queryClient.invalidateQueries(['subscriptions', { rid }]);
				return options?.onSuccess?.(data, rid, context);
			},
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);
};
