import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useSetting, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Subscriptions } from '../../../../app/models/client';
import { InvalidMessage } from '../../../lib/errors/InvalidMessage';
import { NotAuthorizedError } from '../../../lib/errors/NotAuthorizedError';
import { PinMessagesNotAllowed } from '../../../lib/errors/PinMessagesNotAllowed';
import { updatePinMessage } from '../../../lib/mutationEffects/updatePinMessage';
import { roomsQueryKeys } from '../../../lib/queryKeys';

export const usePinMessageMutation = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const allowPinning = useSetting('Message_AllowPinning');
	const pinMessageEndpoint = useEndpoint('POST', '/v1/chat.pinMessage');
	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (message: IMessage) => {
			if (!userId) {
				throw new NotAuthorizedError('Not authorized', {
					method: 'pinMessage',
				});
			}
			if (!allowPinning || !Subscriptions.findOne({ rid: message.rid })) {
				throw new PinMessagesNotAllowed('Pinning messages is not allowed', {
					method: 'pinMessage',
				});
			}

			if (typeof message._id !== 'string') {
				throw new InvalidMessage('Invalid message', {
					method: 'pinMessage',
				});
			}

			await pinMessageEndpoint({ messageId: message._id });
		},
		onMutate: (message) => {
			updatePinMessage(message, { pinned: true });
		},
		onSuccess: (_data) => {
			dispatchToastMessage({ type: 'success', message: t('Message_has_been_pinned') });
		},
		onError: (error, message) => {
			dispatchToastMessage({ type: 'error', message: error });
			updatePinMessage(message, { pinned: false });
		},
		onSettled: (_data, _error, message) => {
			queryClient.invalidateQueries(roomsQueryKeys.pinnedMessages(message.rid));
			queryClient.invalidateQueries(roomsQueryKeys.messageActions(message.rid, message._id));
		},
	});
};
