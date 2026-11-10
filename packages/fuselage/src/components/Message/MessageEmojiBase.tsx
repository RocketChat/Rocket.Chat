import type { HTMLAttributes } from 'react';

export type MessageEmojiBaseProps = {
	name: string;
	image?: string;
} & HTMLAttributes<HTMLSpanElement>;

const MessageEmojiBase = ({ name, image, className, ...props }: MessageEmojiBaseProps) => (
	<span className={`${className || ''} ${name}`} style={image?.length ? { backgroundImage: image } : undefined} {...props} />
);

export default MessageEmojiBase;
