import { useTranslation } from 'react-i18next';

import MessageListOverlayButton from './MessageListOverlayButton';
import { useMessageListScroll } from './MessageListScrollContext';

export type MessageListNewMessagesButtonProps = {
	/** Runs after the list scrolls to the bottom, such as to focus the composer. */
	onClick?: () => void;
};

/**
 * Tells the viewer that someone else's messages arrived while they were reading further up, and takes them down to them.
 */
const MessageListNewMessagesButton = ({ onClick }: MessageListNewMessagesButtonProps) => {
	const { t } = useTranslation();
	const { hasNewMessages, scrollToBottom } = useMessageListScroll();

	return (
		<MessageListOverlayButton
			isVisible={hasNewMessages}
			onClick={() => {
				scrollToBottom();
				onClick?.();
			}}
		>
			{t('New_messages')}
		</MessageListOverlayButton>
	);
};

export default MessageListNewMessagesButton;
