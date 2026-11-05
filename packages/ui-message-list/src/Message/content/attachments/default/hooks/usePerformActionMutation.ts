import type { IMessage, MessageAttachmentAction } from '@rocket.chat/core-typings';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { useMessageInteractions } from '../../../../contexts/MessageInteractionsContext';

type ProcessingType = Exclude<MessageAttachmentAction['actions'][number]['msg_processing_type'], undefined>;

type UsePerformActionMutationParams = {
	processingType: ProcessingType;
	msg?: string;
	mid?: IMessage['_id'];
};

export const usePerformActionMutation = (
	options?: Omit<UseMutationOptions<void, Error, UsePerformActionMutationParams>, 'mutationFn'>,
): UseMutationResult<void, Error, UsePerformActionMutationParams> => {
	const { sendMessage, replyWith, quoteMessageById } = useMessageInteractions();

	return useMutation({
		mutationFn: async ({ processingType, msg, mid }) => {
			switch (processingType) {
				case 'sendMessage':
					if (!msg) return;
					await sendMessage(msg);
					return;

				case 'respondWithMessage':
					if (!msg) return;
					await replyWith(msg);
					return;

				case 'respondWithQuotedMessage':
					if (!mid) return;
					await quoteMessageById(mid);
			}
		},

		...options,
	});
};
