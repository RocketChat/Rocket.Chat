import type { MessageEmojiBaseProps } from './MessageEmojiBase';
import MessageEmojiBase from './MessageEmojiBase';

export type MessageEmojiProps = MessageEmojiBaseProps & {
	/** Shows the emoji large, for a message made only of emoji. */
	big?: boolean;
};

/**
 * An emoji in a message body.
 */
const MessageEmoji = ({ name, className, image, big, ...props }: MessageEmojiProps) => (
	<MessageEmojiBase
		className={['rcx-message__emoji', className, big && 'rcx-message__emoji--big'].filter(Boolean).join(' ')}
		name={name}
		image={image}
		{...props}
	/>
);

export default MessageEmoji;
