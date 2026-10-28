import type { MessageEmojiBaseProps } from '../MessageEmojiBase';
import MessageEmojiBase from '../MessageEmojiBase';

export type ThreadMessageEmojiProps = MessageEmojiBaseProps;

const ThreadMessageEmoji = ({ className, ...props }: ThreadMessageEmojiProps) => (
	<MessageEmojiBase className={`rcx-message-thread__emoji ${className || ''}`} {...props} />
);

export default ThreadMessageEmoji;
