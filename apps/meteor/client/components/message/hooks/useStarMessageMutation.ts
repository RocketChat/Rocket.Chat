import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import { toggleStarredMessage } from '../../../lib/mutationEffects/starredMessage';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useStarMessageMutation = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	const starMessage = useEndpoint('POST', '/v1/chat.starMessage');

	return useMutation({
		mutationFn: async (message: IMessage) => {
			await starMessage({ messageId: message._id });
		},
		onSuccess: (_data, message) => {
			toggleStarredMessage(message, true);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: (_data, _error, message) => {
			queryClient.invalidateQueries(roomsQueryKeys.starredMessages(message.rid));
			queryClient.invalidateQueries(roomsQueryKeys.messageActions(message.rid, message._id));
		},
	});
};
