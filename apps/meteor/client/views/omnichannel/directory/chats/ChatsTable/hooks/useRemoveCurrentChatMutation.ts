import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useQueryClient, useMutation } from '@tanstack/react-query';

export const useRemoveCurrentChatMutation = (
	options?: Omit<UseMutationOptions<null, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<null, Error, IRoom['_id']> => {
	const removeRoom = useEndpoint('POST', '/v1/livechat/rooms.delete');
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (rid) => removeRoom({ roomId: rid }),
		...options,

		onSuccess: (...args) => {
			queryClient.invalidateQueries({
				queryKey: ['current-chats'],
			});
			options?.onSuccess?.(...args);
		},
	});
};
