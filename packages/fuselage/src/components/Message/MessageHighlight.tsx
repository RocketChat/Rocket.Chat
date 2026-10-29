import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageHighlightProps = {
	is?: ElementType;
	clickable?: boolean;
	variant?: 'critical' | 'relevant' | 'other' | 'link';
	className?: string;
	children: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLElement>;

function MessageHighlight({ is: Tag = 'span', variant = 'other', className, clickable, ...props }: MessageHighlightProps) {
	const modifiers = [variant, clickable && 'clickable']
		.filter(Boolean)
		.map((modifier) => `rcx-message__highlight--${modifier}`)
		.join(' ');

	return <Tag className={prependClassName(className, `rcx-box rcx-box--full rcx-message__highlight ${modifiers}`)} {...props} />;
}

export default MessageHighlight;
