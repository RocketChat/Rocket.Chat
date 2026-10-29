import type { ReactNode } from 'react';

import type { PartAttributes } from '../../types/ElementAttributes';

/** What the emoji parts (`MessageEmoji`, `MessageReactionEmoji`, `ThreadMessageEmoji`) take. */
export type MessageEmojiBaseProps = PartAttributes<HTMLSpanElement> & {
	/** The emoji sprite's class name, added to the element as is. */
	'name': string;
	/** A custom emoji's `background-image` value. */
	'image'?: string;
	'children'?: ReactNode;
	// The emoji's shortcode, which the app's tooltip reads back
	'data-title'?: string;
};

const MessageEmojiBase = ({ name, image, className, ...props }: MessageEmojiBaseProps) => (
	<span className={`${className || ''} ${name}`} style={image?.length ? { backgroundImage: image } : undefined} {...props} />
);

export default MessageEmojiBase;
