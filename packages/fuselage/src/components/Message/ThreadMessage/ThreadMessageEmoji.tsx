import type { MessageEmojiBaseProps } from '../MessageEmojiBase.js';
import MessageEmojiBase from '../MessageEmojiBase.js';

export type ThreadMessageEmojiProps = MessageEmojiBaseProps;

const ThreadMessageEmoji = ({ className, ...props }: ThreadMessageEmojiProps) => (
	<MessageEmojiBase className={`rcx-message-thread__emoji ${className || ''}`} {...props} />
);

export default ThreadMessageEmoji;
