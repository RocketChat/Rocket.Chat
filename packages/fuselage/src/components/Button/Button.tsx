import type { AllHTMLAttributes } from 'react';
import { useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type ButtonProps = {
	/** Renders a link instead of a button, for actions that navigate or download. */
	is?: 'button' | 'a';
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	disabled?: boolean;
	loading?: boolean;
	square?: boolean;
	/** Lowers the minimum width so a label of one or two characters fits. */
	compact?: boolean;
	external?: boolean;
	icon?: IconProps['name'];
} & ElementProps<HTMLButtonElement | HTMLAnchorElement, AllHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>>;

/**
 * The 40px and 48px buttons pair with a 20px icon; the smaller sizes use 16px.
 */
const resolveIconSize = (size: ButtonProps['size']): IconProps['size'] => (size === undefined || size === 'large' ? 'x20' : 'x16');

/**
 * A label counts as present whenever React would render something for it, which
 * includes the numeric `0` a truthiness check would discard.
 */
const hasVisibleLabel = (children: ButtonProps['children']): boolean => children === 0 || Boolean(children);

/**
 * Indicates an actionable user action.
 */
function Button({
	ref,
	variant,
	external,
	icon,
	is = 'button',
	rel,
	size,
	square,
	compact,
	loading,
	disabled,
	children,
	...props
}: ButtonProps) {
	const extraProps =
		(is === 'a' && {
			rel: rel ?? (external ? 'noopener noreferrer' : undefined),
			target: external ? '_blank' : undefined,
		}) ||
		(is === 'button' && {
			type: 'button',
		}) ||
		{};

	const kindAndVariantProps = useMemo(() => (variant ? { [`rcx-button--${variant}`]: true } : {}), [variant]);

	const iconSize = resolveIconSize(size);
	const hasLeadingIcon = Boolean(icon || loading);
	const hasLabel = hasVisibleLabel(children);

	return (
		<Box
			is={is}
			rcx-button
			{...kindAndVariantProps}
			rcx-button--small={size === 'small'}
			rcx-button--medium={size === 'medium'}
			rcx-button--large={size === 'large'}
			rcx-button--square={square}
			rcx-button--compact={compact}
			rcx-button--with-icon={hasLeadingIcon && !square && hasLabel}
			rcx-button--tiny-square={size === 'tiny' && square}
			rcx-button--mini-square={size === 'mini' && square}
			rcx-button--small-square={size === 'small' && square}
			rcx-button--medium-square={size === 'medium' && square}
			rcx-button--large-square={size === 'large' && square}
			rcx-button--loading={loading}
			disabled={disabled || loading}
			ref={ref}
			{...extraProps}
			{...props}
		>
			<span className='rcx-button--content'>
				{icon && !loading && <Icon className='rcx-button__icon' size={iconSize} name={icon} />}
				{loading && <Icon className='rcx-button__icon' size={iconSize} name='loading' />}
				{children}
			</span>
		</Box>
	);
}

export default Button;
