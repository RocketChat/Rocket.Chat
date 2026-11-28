import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { prependClassName } from '../../helpers/prependClassName';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

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
} & ElementProps<HTMLElement, AnchorHTMLAttributes<HTMLElement>>;

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
		<Box is={href ? 'a' : 'span'} className={prependClassName(className, `rcx-tag ${modifiers}`)} onClick={onClick} href={href} {...props}>
			{icon}
			<span className='rcx-tag__inner'>{children}</span>
		</Box>
	);
};

export default Tag;
