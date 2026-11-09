import type { MessageEmojiBaseProps } from './MessageEmojiBase.js';
import MessageEmojiBase from './MessageEmojiBase.js';

export type MessageEmojiProps = MessageEmojiBaseProps & {
	big?: boolean;
};

const MessageEmoji = ({ name, className, image, big, ...props }: MessageEmojiProps) => (
	<MessageEmojiBase
		className={['rcx-message__emoji', className, big && 'rcx-message__emoji--big'].filter(Boolean).join(' ')}
		name={name}
		image={image}
		{...props}
	/>
);

export default MessageEmoji;
