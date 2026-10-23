import type { ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';
import { Box, type BoxProps } from '../Box';

export type TagProps = {
	medium?: boolean;
	large?: boolean;
	/**
	 * Fully rounded shape. Use for interactive tags such as filters
	 */
	pill?: boolean;
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'secondary-danger' | 'secondary-warning' | 'secondary-info' | 'featured';
	disabled?: boolean;
	icon?: ReactNode;
} & Omit<BoxProps, 'is'>;

/**
 * Used for mentions
 */
const Tag = ({ large, medium, pill, className, disabled, onClick, variant, children, icon, href, ...props }: TagProps) => {
	const modifiers = [
		variant,
		medium && 'medium',
		large && 'large',
		pill && 'pill',
		disabled && 'disabled',
		onClick && 'clickable',
		href && 'clickable',
	]
		.filter(Boolean)
		.map((modifier) => `rcx-tag--${modifier}`)
		.join(' ');

	return (
		<Box
			is={href ? 'a' : 'span'}
			className={prependClassName(className as string, `rcx-tag ${modifiers}`)}
			onClick={onClick}
			href={href}
			{...props}
		>
			{icon}
			<span className='rcx-tag__inner'>{children}</span>
		</Box>
	);
};

export default Tag;
