import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type BadgeProps = {
	is?: ElementType<HTMLAttributes<HTMLSpanElement>>;
	variant?: 'secondary' | 'primary' | 'danger' | 'warning';
	small?: boolean;
	className?: string;
	children?: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLSpanElement>;

/**
 * Communicates notification’s amount and types.
 */
function Badge({ is: Component = 'span', variant = 'secondary', small, className, ...props }: BadgeProps) {
	const modifiers = [variant, small && 'small']
		.filter(Boolean)
		.map((modifier) => `rcx-badge--${modifier}`)
		.join(' ');

	return <Component className={prependClassName(className, `rcx-box rcx-box--full rcx-badge ${modifiers}`)} {...props} />;
}

export default Badge;
