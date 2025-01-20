import type { IRoom } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { subscriptionsQueryKeys } from '../../../../../../lib/queryKeys';

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
			await queryClient.invalidateQueries({ queryKey: ['current-chats'] });
			queryClient.removeQueries({ queryKey: ['rooms', rid] });
			queryClient.removeQueries({ queryKey: ['/v1/rooms.info', rid] });
			queryClient.removeQueries({ queryKey: subscriptionsQueryKeys.subscription(rid) });
			return options?.onSuccess?.(data, rid, context);
		},
	});
};
