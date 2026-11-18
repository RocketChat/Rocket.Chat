import type { HTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageHighlightProps = {
	/** Shows the pointer cursor and underlines the text on hover, for a mention that does something when clicked. */
	clickable?: boolean;
	/**
	 * What the text points to: `critical` for the current user, `relevant` for everyone in the room (`@all`, `@here`),
	 * `other` for another user and `link` for a room.
	 */
	variant?: 'critical' | 'relevant' | 'other' | 'link';
	className?: string;
	children: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLElement>;

/**
 * A mention or highlighted word in a message body, colored by what it points to.
 */
function MessageHighlight({ variant = 'other', className, clickable, ...props }: MessageHighlightProps) {
	const modifiers = [variant, clickable && 'clickable']
		.filter(Boolean)
		.map((modifier) => `rcx-message__highlight--${modifier}`)
		.join(' ');

	return <span className={prependClassName(className, `rcx-message__highlight ${modifiers}`)} {...props} />;
}

export default MessageHighlight;
