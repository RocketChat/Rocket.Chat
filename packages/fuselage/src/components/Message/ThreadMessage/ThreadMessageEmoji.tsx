import type { MessageEmojiBaseProps } from '../MessageEmojiBase';
import MessageEmojiBase from '../MessageEmojiBase';

export type ThreadMessageEmojiProps = MessageEmojiBaseProps;

/**
 * An emoji in a thread message's excerpt, sized to its text.
 */
const ThreadMessageEmoji = ({ className, ...props }: ThreadMessageEmojiProps) => (
	<MessageEmojiBase className={`rcx-message-thread__emoji ${className || ''}`} {...props} />
);

export default ThreadMessageEmoji;
