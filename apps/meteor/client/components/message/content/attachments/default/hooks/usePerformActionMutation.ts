import type { IMessage, MessageAttachmentAction } from '@rocket.chat/core-typings';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { useChat } from '../../../../../../views/room/contexts/ChatContext';

type ProcessingType = Exclude<MessageAttachmentAction['actions'][number]['msg_processing_type'], undefined>;

type UsePerfomActionMutationParams = {
	processingType: ProcessingType;
	msg?: string;
	mid?: IMessage['_id'];
};

export const usePerformActionMutation = (
	options?: Omit<UseMutationOptions<void, Error, UsePerfomActionMutationParams>, 'mutationFn'>,
): UseMutationResult<void, Error, UsePerfomActionMutationParams> => {
	const chat = useChat();

	return useMutation({
		mutationFn: async ({ processingType, msg, mid }) => {
			if (!chat) {
				return;
			}

			switch (processingType) {
				case 'sendMessage':
					if (!msg) return;
					await chat.flows.sendMessage({ text: msg });
					return;

				case 'respondWithMessage':
					if (!msg) return;
					await chat.composer?.replyWith(msg);
					return;

				case 'respondWithQuotedMessage':
					if (!mid) return;
					const message = await chat.data.getMessageByID(mid);
					await chat.composer?.quoteMessage(message);
			}
		},

		...options,
	});
};
