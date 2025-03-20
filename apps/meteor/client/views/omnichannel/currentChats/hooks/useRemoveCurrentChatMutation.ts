import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useQueryClient, useMutation } from '@tanstack/react-query';

export const useRemoveCurrentChatMutation = (
	options?: Omit<UseMutationOptions<void, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<void, Error, IRoom['_id']> => {
	const removeRoom = useMethod('livechat:removeRoom');
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (rid) => removeRoom(rid),
		...options,

		onSuccess: (...args) => {
			queryClient.invalidateQueries({
				queryKey: ['current-chats'],
			});
			options?.onSuccess?.(...args);
		},
	});
};
