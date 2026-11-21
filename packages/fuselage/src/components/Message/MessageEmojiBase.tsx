import type { HTMLAttributes } from 'react';

export type MessageEmojiBaseProps = {
	/** The emoji sprite's class name, added to the element as is. */
	name: string;
	image?: string;
} & HTMLAttributes<HTMLSpanElement>;

const MessageEmojiBase = ({ name, image, className, style, ...props }: MessageEmojiBaseProps) => (
	<span className={`${className || ''} ${name}`} style={image?.length ? { ...style, backgroundImage: image } : style} {...props} />
);

export default MessageEmojiBase;
