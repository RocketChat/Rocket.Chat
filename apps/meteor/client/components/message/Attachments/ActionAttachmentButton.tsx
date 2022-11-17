import { IMessage, MessageAttachmentAction } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import React, { ReactElement, ReactNode } from 'react';

import { useMessageActions } from '../../../views/room/contexts/MessageContext';

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
	const {
		actions: { sendMessage, respondWithMessage, respondWithQuotedMessage },
	} = useMessageActions();

	return useMutation(async ({ processingType, msg, mid }) => {
		switch (processingType) {
			case 'sendMessage':
				if (!msg) return;
				return sendMessage?.({ msg });

			case 'respondWithMessage':
				if (!msg) return;
				return respondWithMessage?.({ msg });

			case 'respondWithQuotedMessage':
				if (!mid) return;
				return respondWithQuotedMessage?.({ mid });
		}
	}, options);
};

const ActionAttachmentButton = ({ children, processingType, msg, mid }: ActionAttachmentButtonProps): ReactElement => {
	const performActionMutation = usePerformActionMutation();

	return (
		<Button
			className={`js-actionButton-${processingType}`} // TODO: Remove this class when threads are implemented as a component
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
