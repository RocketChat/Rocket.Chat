import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useReturnChatToQueueMutation = (
	options?: Omit<UseMutationOptions<void, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<void, Error, IRoom['_id']> => {
	const returnChatToQueue = useMethod('livechat:returnAsInquiry');

	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (rid) => {
			await returnChatToQueue(rid);
		},

		...options,

		onSuccess: async (data, rid, context) => {
			await queryClient.invalidateQueries({
				queryKey: ['current-chats'],
			});
			await queryClient.removeQueries({
				queryKey: ['rooms', rid],
			});
			await queryClient.removeQueries({
				queryKey: ['/v1/rooms.info', rid],
			});
			await queryClient.removeQueries({
				queryKey: ['subscriptions', { rid }],
			});
			return options?.onSuccess?.(data, rid, context);
		},
	});
};
