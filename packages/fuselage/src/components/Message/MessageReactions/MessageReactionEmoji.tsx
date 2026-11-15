import type { MessageEmojiBaseProps } from '../MessageEmojiBase';
import MessageEmojiBase from '../MessageEmojiBase';

export type MessageReactionEmojiProps = MessageEmojiBaseProps;

const MessageReactionEmoji = ({ className, ...props }: MessageReactionEmojiProps) => (
	<MessageEmojiBase className={`rcx-message-reactions__emoji ${className || ''}`} {...props} />
);

export default MessageReactionEmoji;
