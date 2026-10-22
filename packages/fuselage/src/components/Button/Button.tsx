import type { AllHTMLAttributes, RefAttributes } from 'react';
import { useMemo } from 'react';

import { Box, type BoxProps } from '../Box';
import { Icon, type IconProps } from '../Icon';

export type ButtonProps = Omit<BoxProps, 'ref'> & {
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	/** @deprecated Use `variant="primary"` instead. */
	primary?: boolean;
	/** @deprecated Use `variant="secondary"` instead. */
	secondary?: boolean;
	/** @deprecated Use `variant="danger"` instead. */
	danger?: boolean;
	/** @deprecated Use `variant="warning"` instead. */
	warning?: boolean;
	/** @deprecated Use `variant="success"` instead. */
	success?: boolean;
	disabled?: boolean;
	loading?: boolean;
	/** @deprecated Use `size="mini"` instead. */
	mini?: boolean;
	/** @deprecated Use `size="tiny"` instead. */
	tiny?: boolean;
	/** @deprecated Use `size="small"` instead. */
	small?: boolean;
	/** @deprecated Use `size="medium"` instead. */
	medium?: boolean;
	/** @deprecated Use `size="large"` instead. */
	large?: boolean;
	square?: boolean;
	external?: boolean;
	icon?: IconProps['name'];
} & Omit<AllHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>, 'is' | 'className' | 'size'> &
	RefAttributes<HTMLButtonElement | HTMLAnchorElement>;

/**
 * The 40px and 48px buttons pair with a 20px icon; the smaller sizes use 16px.
 */
const resolveIconSize = (size: ButtonProps['size']): IconProps['size'] => (size === undefined || size === 'large' ? 'x20' : 'x16');

/**
 * Indicates an actionable user action.
 */
function Button({
	ref,
	variant,
	primary,
	secondary,
	danger,
	warning,
	success,
	external,
	icon,
	is = 'button',
	rel: _rel,
	size,
	tiny,
	mini,
	small,
	medium,
	large,
	square,
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

	const kindAndVariantProps = useMemo(() => {
		const kind =
			variant ||
			(primary && 'primary') ||
			(secondary && success && 'secondary-success') ||
			(secondary && warning && 'secondary-warning') ||
			(secondary && danger && 'secondary-danger') ||
			(success && 'success') ||
			(warning && 'warning') ||
			(danger && 'danger') ||
			(secondary && 'secondary');

		if (kind) {
			return {
				[`rcx-button--${kind}`]: true,
			};
		}

		return {};
	}, [variant, primary, secondary, danger, warning, success]);

	const effectiveSize =
		size || (mini && 'mini') || (tiny && 'tiny') || (small && 'small') || (medium && 'medium') || (large && 'large') || undefined;

	const iconSize = resolveIconSize(effectiveSize);
	const hasLeadingIcon = Boolean(icon || loading);

	// The gap only separates the icon from a label. On an icon-only button it has
	// nothing to separate and just pushes the icon off centre by half its width.
	const iconGap = children ? 4 : undefined;

	return (
		<Box
			is={is}
			type='button'
			rcx-button
			{...kindAndVariantProps}
			rcx-button--small={effectiveSize === 'small'}
			rcx-button--medium={effectiveSize === 'medium'}
			rcx-button--large={effectiveSize === 'large'}
			rcx-button--square={square}
			rcx-button--with-icon={hasLeadingIcon && !square && Boolean(children)}
			rcx-button--tiny-square={effectiveSize === 'tiny' && square}
			rcx-button--mini-square={effectiveSize === 'mini' && square}
			rcx-button--small-square={effectiveSize === 'small' && square}
			rcx-button--medium-square={effectiveSize === 'medium' && square}
			rcx-button--large-square={effectiveSize === 'large' && square}
			rcx-button--loading={loading}
			disabled={disabled || loading}
			ref={ref}
			{...extraProps}
			{...props}
		>
			<span className='rcx-button--content'>
				{icon && !loading && <Icon size={iconSize} name={icon} marginInlineEnd={iconGap} />}
				{loading && <Icon size={iconSize} name='loading' marginInlineEnd={iconGap} />}
				{children}
			</span>
		</Box>
	);
}

export default Button;
