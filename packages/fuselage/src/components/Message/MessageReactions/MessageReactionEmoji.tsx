import type { MessageEmojiBaseProps } from '../MessageEmojiBase.js';
import MessageEmojiBase from '../MessageEmojiBase.js';

export type MessageReactionEmojiProps = MessageEmojiBaseProps;

const MessageReactionEmoji = ({ className, ...props }: MessageReactionEmojiProps) => (
	<MessageEmojiBase className={`rcx-message-reactions__emoji ${className || ''}`} {...props} />
);

export default MessageReactionEmoji;
