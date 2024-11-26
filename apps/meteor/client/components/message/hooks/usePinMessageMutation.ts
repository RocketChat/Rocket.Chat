import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const usePinMessageMutation = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (message: IMessage) => {
			await sdk.call('pinMessage', message);
		},
		onSuccess: (_data) => {
			dispatchToastMessage({ type: 'success', message: t('Message_has_been_pinned') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: (_data, _error, message) => {
			queryClient.invalidateQueries(roomsQueryKeys.pinnedMessages(message.rid));
			queryClient.invalidateQueries(roomsQueryKeys.messageActions(message.rid, message._id));
		},
	});
};
