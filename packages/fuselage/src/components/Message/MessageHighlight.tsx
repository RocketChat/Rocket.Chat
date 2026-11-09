import type { HTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageHighlightProps = {
	clickable?: boolean;
	variant?: 'critical' | 'relevant' | 'other' | 'link';
	className?: string;
	children: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLElement>;

function MessageHighlight({ variant = 'other', className, clickable, ...props }: MessageHighlightProps) {
	const modifiers = [variant, clickable && 'clickable']
		.filter(Boolean)
		.map((modifier) => `rcx-message__highlight--${modifier}`)
		.join(' ');

	return <span className={prependClassName(className, `rcx-message__highlight ${modifiers}`)} {...props} />;
}

export default MessageHighlight;
