import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useResumeChatOnHoldMutation = (
	options?: Omit<UseMutationOptions<void, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<void, Error, IRoom['_id']> => {
	const resumeChatOnHold = useMethod('livechat:resumeOnHold');

	const queryClient = useQueryClient();

	return useMutation(
		async (rid) => {
			await resumeChatOnHold(rid, { clientAction: true });
		},
		{
			...options,
			onSuccess: async (data, rid, context) => {
				await queryClient.invalidateQueries(['current-chats']);
				await queryClient.invalidateQueries(['rooms', rid]);
				await queryClient.invalidateQueries(['subscriptions', { rid }]);
				return options?.onSuccess?.(data, rid, context);
			},
		},
	);
};
