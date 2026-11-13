import type { MessageEmojiBaseProps } from '../MessageEmojiBase';
import MessageEmojiBase from '../MessageEmojiBase';

export type ThreadMessageEmojiProps = MessageEmojiBaseProps;

const ThreadMessageEmoji = ({ className, ...props }: ThreadMessageEmojiProps) => (
	<MessageEmojiBase {...props} kind='thread' className={`rcx-message-thread__emoji ${className || ''}`} />
);

export default ThreadMessageEmoji;
