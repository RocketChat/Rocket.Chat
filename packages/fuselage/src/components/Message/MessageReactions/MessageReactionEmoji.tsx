import type { MessageEmojiBaseProps } from '../MessageEmojiBase';
import MessageEmojiBase from '../MessageEmojiBase';

export type MessageReactionEmojiProps = MessageEmojiBaseProps;

const MessageReactionEmoji = ({ className, ...props }: MessageReactionEmojiProps) => (
	<MessageEmojiBase {...props} kind='reaction' className={`rcx-message-reactions__emoji ${className || ''}`} />
);

export default MessageReactionEmoji;
