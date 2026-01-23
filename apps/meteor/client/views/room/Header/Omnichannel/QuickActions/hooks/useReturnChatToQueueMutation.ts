import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { roomsQueryKeys, subscriptionsQueryKeys } from '../../../../../../lib/queryKeys';

export const useReturnChatToQueueMutation = (
	options?: Omit<UseMutationOptions<void, Error, IRoom['_id']>, 'mutationFn'>,
): UseMutationResult<void, Error, IRoom['_id']> => {
	const returnChatToQueue = useEndpoint('POST', '/v1/livechat/inquiries.returnAsInquiry');

	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (rid) => {
			await returnChatToQueue({ roomId: rid });
		},
		...options,
		onSuccess: async (data, rid, context) => {
			await queryClient.invalidateQueries({ queryKey: ['current-chats'] });
			queryClient.removeQueries({ queryKey: roomsQueryKeys.room(rid) });
			queryClient.removeQueries({ queryKey: roomsQueryKeys.info(rid) });
			queryClient.removeQueries({ queryKey: subscriptionsQueryKeys.subscription(rid) });
			return options?.onSuccess?.(data, rid, context);
		},
	});
};
