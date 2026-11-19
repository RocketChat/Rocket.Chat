import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type BadgeProps = {
	is?: ElementType<HTMLAttributes<HTMLSpanElement>>;
	/** Type of the event counted, shown by color. */
	variant?: 'secondary' | 'primary' | 'danger' | 'warning';
	/** Lowers the minimum size, so that a badge without content is a dot. */
	small?: boolean;
	className?: string;
	children?: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLSpanElement>;

/** Shows how many notifications something has, and their type. */
function Badge({ is: Tag = 'span', variant = 'secondary', small, className, ...props }: BadgeProps) {
	const modifiers = [variant, small && 'small']
		.filter(Boolean)
		.map((modifier) => `rcx-badge--${modifier}`)
		.join(' ');

	return <Tag className={prependClassName(className, `rcx-box rcx-box--full rcx-badge ${modifiers}`)} {...props} />;
}

export default Badge;
