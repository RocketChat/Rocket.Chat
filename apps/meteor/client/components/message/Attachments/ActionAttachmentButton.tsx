import type { IMessage, MessageAttachmentAction } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import { useChat } from '../../../views/room/contexts/ChatContext';

type ProcessingType = Exclude<MessageAttachmentAction['actions'][number]['msg_processing_type'], undefined>;

type UsePerfomActionMutationParams = {
	processingType: ProcessingType;
	msg?: string;
	mid?: IMessage['_id'];
};

type ActionAttachmentButtonProps = {
	children: ReactNode;
	mid?: IMessage['_id'];
	msg?: string;
	processingType: ProcessingType;
};

const usePerformActionMutation = (
	options?: Omit<UseMutationOptions<void, Error, UsePerfomActionMutationParams>, 'mutationFn'>,
): UseMutationResult<void, Error, UsePerfomActionMutationParams> => {
	const chat = useChat();

	return useMutation(async ({ processingType, msg, mid }) => {
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
	}, options);
};

const ActionAttachmentButton = ({ children, processingType, msg, mid }: ActionAttachmentButtonProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();

	const performActionMutation = usePerformActionMutation({
		onError: (error) => {
			console.error(error);
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return (
		<Button
			small
			value={msg}
			id={mid}
			disabled={performActionMutation.isLoading}
			onClick={(event): void => {
				event.preventDefault();

				performActionMutation.mutate({
					processingType,
					msg,
					mid,
				});
			}}
		>
			{children}
		</Button>
	);
};

export default ActionAttachmentButton;
