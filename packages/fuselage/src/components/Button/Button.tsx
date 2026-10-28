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
 * Indicates an actionable user action.
 */
function Button({
	ref,
	variant,
	external,
	icon,
	is = 'button',
	rel: _rel,
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
			rel: external ? 'noopener noreferrer' : undefined,
			target: external ? '_blank' : undefined,
		}) ||
		(is === 'button' && {
			type: 'button',
		}) ||
		{};

	const kindAndVariantProps = useMemo(() => (variant ? { [`rcx-button--${variant}`]: true } : {}), [variant]);

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
				{icon && !loading && <Icon className='rcx-button__icon' size='x16' name={icon} />}
				{loading && <Icon className='rcx-button__icon' size='x16' name='loading' />}
				{children}
			</span>
		</Box>
	);
}

export default Button;
