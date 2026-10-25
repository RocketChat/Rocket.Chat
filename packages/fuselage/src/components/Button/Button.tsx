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

	const inactiveLinkProps =
		is === 'a' && (disabled || loading)
			? {
					'href': undefined,
					'role': 'link',
					'onClick': undefined,
					'onClickCapture': undefined,
					'tabIndex': -1,
					'aria-disabled': true,
				}
			: {};

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

	return (
		<Box
			is={is}
			rcx-button
			{...kindAndVariantProps}
			rcx-button--small={effectiveSize === 'small'}
			rcx-button--medium={effectiveSize === 'medium'}
			rcx-button--large={effectiveSize === 'large'}
			rcx-button--square={square}
			rcx-button--compact={compact}
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
			{...inactiveLinkProps}
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
