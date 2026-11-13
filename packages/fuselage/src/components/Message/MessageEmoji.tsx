import type { MessageEmojiBaseProps } from './MessageEmojiBase';
import MessageEmojiBase from './MessageEmojiBase';

export type MessageEmojiProps = MessageEmojiBaseProps & {
	big?: boolean;
};

const MessageEmoji = ({ className, big, ...props }: MessageEmojiProps) => (
	<MessageEmojiBase
		{...props}
		kind='message'
		className={['rcx-message__emoji', className, big && 'rcx-message__emoji--big'].filter(Boolean).join(' ')}
	/>
);

export default MessageEmoji;
