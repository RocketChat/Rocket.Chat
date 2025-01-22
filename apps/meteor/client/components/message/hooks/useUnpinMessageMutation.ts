import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { updatePinMessage } from '../../../lib/mutationEffects/updatePinMessage';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const useUnpinMessageMutation = () => {
	const { t } = useTranslation();
	const unpinMessage = useEndpoint('POST', '/v1/chat.unPinMessage');
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (message: IMessage) => unpinMessage({ messageId: message._id }),
		onMutate: (message) => {
			updatePinMessage(message, { pinned: false });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Message_has_been_unpinned') });
		},
		onError: (error, message) => {
			dispatchToastMessage({ type: 'error', message: error });
			updatePinMessage(message, { pinned: true });
		},
		onSettled: (_data, _error, message) => {
			queryClient.invalidateQueries({ queryKey: roomsQueryKeys.pinnedMessages(message.rid) });
		},
	});
};
