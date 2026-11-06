import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

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
} & TagElementProps &
	ElementProps<HTMLElement, AnchorHTMLAttributes<HTMLElement> & Pick<ButtonHTMLAttributes<HTMLElement>, 'type'>>;

/**
 * The element to render. Without `is`, a tag with `href` is a link and any other a span. Use `button` for a tag
 * that acts, such as a filter toggled on and off with `aria-pressed`; only a link takes `href`.
 */
type TagElementProps = { is?: undefined } | { is: 'a' } | { is: 'span' | 'button'; href?: never };

/**
 * Used for mentions
 */
const Tag = ({ large, medium, pill, className, disabled, onClick, variant, children, icon, href, is, ...props }: TagProps) => {
	const element = is ?? (href ? 'a' : 'span');

	const modifiers = [
		variant,
		medium && 'medium',
		large && 'large',
		pill && 'pill',
		disabled && 'disabled',
		!disabled && (onClick || href || element === 'button') && 'clickable',
		element === 'button' && 'button',
	]
		.filter(Boolean)
		.map((modifier) => `rcx-tag--${modifier}`)
		.join(' ');

	return (
		<Box
			is={element}
			className={prependClassName(className, `rcx-tag ${modifiers}`)}
			onClick={onClick}
			href={href}
			{...(element === 'button' && { type: 'button', disabled })}
			{...props}
		>
			{icon}
			<span className='rcx-tag__inner'>{children}</span>
		</Box>
	);
};

export default Tag;
