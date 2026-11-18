import type { AllHTMLAttributes } from 'react';
import { useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type ButtonProps = {
	/** Renders a link instead of a button, for actions that navigate or download. */
	is?: 'button' | 'a';
	/**
	 * `primary` calls attention to the evident next step; `secondary` keeps a neutral presence when the next step is
	 * unclear. The other variants carry the same pair for danger, warning and success.
	 */
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	/** Match the size of the surrounding buttons and inputs. */
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	disabled?: boolean;
	/** Replaces the icon with a spinner and disables the button, with the label left as it is. */
	loading?: boolean;
	/** Renders a squared, label-less button, to sit beside other buttons and inputs of the same height. */
	square?: boolean;
	/** Lowers the minimum width so a label of one or two characters fits. */
	compact?: boolean;
	/** With `is='a'`, opens the link in a new tab. */
	external?: boolean;
	/** Leading icon, for a label that needs visual support. */
	icon?: IconProps['name'];
} & ElementProps<HTMLButtonElement | HTMLAnchorElement, AllHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>>;

/**
 * Triggers an action: changes data or how it is displayed, changes a state, or takes the user somewhere else in the
 * app or on another site.
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
