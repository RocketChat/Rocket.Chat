import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import { toggleStarredMessage } from '../../../lib/mutationEffects/starredMessage';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useUnstarMessageMutation = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	const unstarMessage = useEndpoint('POST', '/v1/chat.unStarMessage');

	return useMutation({
		mutationFn: async (message: IMessage) => {
			await unstarMessage({ messageId: message._id });
		},
		onSuccess: (_data, message) => {
			toggleStarredMessage(message, false);
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
