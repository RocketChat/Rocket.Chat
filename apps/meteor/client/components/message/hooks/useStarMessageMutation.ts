import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { toggleStarredMessage } from '../../../lib/mutationEffects/starredMessage';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useStarMessageMutation = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	const starMessage = useEndpoint('POST', '/v1/chat.starMessage');

	return useMutation({
		mutationFn: async (message: IMessage) => {
			await starMessage({ messageId: message._id });
		},
		onSuccess: (_data, message) => {
			toggleStarredMessage(message, true);
			dispatchToastMessage({ type: 'success', message: t('Message_has_been_starred') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: (_data, _error, message) => {
			queryClient.invalidateQueries({ queryKey: roomsQueryKeys.starredMessages(message.rid) });
		},
	});
};
