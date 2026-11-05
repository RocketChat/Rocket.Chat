import { useTranslation } from 'react-i18next';

import MessageListOverlayButton from './MessageListOverlayButton';
import { useMessageListScroll } from './MessageListScrollContext';

export type MessageListJumpToLatestButtonProps = {
	onClick?: () => void;
};

/**
 * Takes the viewer from an older part of the conversation back to its latest messages.
 */
const MessageListJumpToLatestButton = ({ onClick }: MessageListJumpToLatestButtonProps) => {
	const { t } = useTranslation();
	const { hasNewerMessages, scrollToBottom } = useMessageListScroll();

	return (
		<MessageListOverlayButton
			isVisible={hasNewerMessages}
			onClick={() => {
				scrollToBottom();
				onClick?.();
			}}
		>
			{t('Jump_to_recent_messages')}
		</MessageListOverlayButton>
	);
};

export default MessageListJumpToLatestButton;
