import type { IMessage, MessageAttachmentAction } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';

import { usePerformActionMutation } from './hooks/usePerformActionMutation';

type ProcessingType = Exclude<MessageAttachmentAction['actions'][number]['msg_processing_type'], undefined>;

type ActionAttachmentButtonProps = {
	children: ReactNode;
	mid?: IMessage['_id'];
	msg?: string;
	processingType: ProcessingType;
};

const ActionAttachmentButton = ({ children, processingType, msg, mid }: ActionAttachmentButtonProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();

	const performActionMutation = usePerformActionMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return (
		<Button
			small
			value={msg}
			id={mid}
			disabled={performActionMutation.isPending}
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
