import type { IMessage } from '@rocket.chat/core-typings';
import { MessageToolbarWrapper } from '@rocket.chat/fuselage';
import { Suspense, lazy, memo, useState } from 'react';

import type { MessageActionContext } from './contexts/MessageAction';
import { useMessageDisplay } from './contexts/MessageDisplayContext';
import { useMessageRelatedData } from './contexts/MessageRelatedDataContext';
import { useIsVisible } from './hooks/useIsVisible';

export type MessageToolbarHolderProps = {
	message: IMessage;
	context?: MessageActionContext;
};

const MessageToolbar = lazy(() => import('./toolbar/MessageToolbar'));

const MessageToolbarHolder = ({ message, context }: MessageToolbarHolderProps) => {
	const { allowsInteraction } = useMessageDisplay();
	const { useConversation } = useMessageRelatedData();
	const [ref, isVisible] = useIsVisible();
	const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false);

	const showToolbar = allowsInteraction && (isVisible || isToolbarMenuOpen);

	const { data: conversation } = useConversation(message, { enabled: showToolbar });

	if (!allowsInteraction) {
		return null;
	}

	return (
		<MessageToolbarWrapper ref={ref} visible={isToolbarMenuOpen}>
			{showToolbar && conversation?.room && (
				<Suspense fallback={null}>
					<MessageToolbar
						message={message}
						messageContext={context}
						room={conversation.room}
						subscription={conversation.subscription}
						onChangeMenuVisibility={setIsToolbarMenuOpen}
					/>
				</Suspense>
			)}
		</MessageToolbarWrapper>
	);
};

export default memo(MessageToolbarHolder);
