import { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

export const useRemoveCurrentChatMutation = (
	options?: Omit<UseMutationOptions<void, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<void, Error, IRoom['_id']> => {
	const removeRoom = useMethod('livechat:removeRoom');
	const queryClient = useQueryClient();

	return useMutation((rid) => removeRoom(rid), {
		...options,
		onSuccess: (...args) => {
			queryClient.invalidateQueries(['current-chats']);
			options?.onSuccess?.(...args);
		},
	});
};
