import type { Keys as IconName } from '@rocket.chat/icons';
import type { AllHTMLAttributes, ReactElement, ReactNode, RefAttributes } from 'react';
import { isValidElement, useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon } from '../Icon';

export type IconButtonSize = {
	/** @deprecated Use `size="large"` instead. */
	large?: boolean;
	/** @deprecated Use `size="medium"` instead. */
	medium?: boolean;
	/** @deprecated Use `size="small"` instead. */
	small?: boolean;
	/** @deprecated Use `size="tiny"` instead. */
	tiny?: boolean;
	/** @deprecated Use `size="mini"` instead. */
	mini?: boolean;
};

export type IconButtonProps = {
	icon: IconName | ReactElement<any>;
	/**
	 * What to pin to the button's corner, if anything — a `Badge`, as a rule.
	 *
	 * It is hidden from assistive technology, always: `aria-label` replaces a button's contents rather than adding
	 * to them, so a badge inside a labelled button is never read out. What it says has to reach `aria-label`
	 * instead, which is the caller's to write.
	 */
	badge?: ReactNode;
	/** The corner the badge is pinned to. */
	badgePosition?: 'top-end' | 'bottom-end';
	variant?:
		'primary' | 'secondary' | 'info' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	/** @deprecated Use `variant="primary"` instead. */
	primary?: boolean;
	/** @deprecated Use `variant="secondary"` instead. */
	secondary?: boolean;
	/** @deprecated Use `variant="info"` instead. */
	info?: boolean;
	/** @deprecated Use `variant="danger"` instead. */
	danger?: boolean;
	/** @deprecated Use `variant="warning"` instead. */
	warning?: boolean;
	/** @deprecated Use `variant="success"` instead. */
	success?: boolean;
	pressed?: boolean;
	/** Renders a link instead of a button, for actions that navigate or download. */
	is?: 'button' | 'a';
	/** Opens the link in a new tab, without giving it access to this page. */
	external?: boolean;
	/** Paints the glyph with a font token, for icon-only actions on light surfaces. */
	color?: 'default' | 'danger';
} & IconButtonSize &
	Omit<ElementProps<HTMLButtonElement | HTMLAnchorElement, AllHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>>, 'ref'> &
	RefAttributes<Element>;

const iconSizes = {
	mini: 'x12',
	tiny: 'x16',
	small: 'x20',
	medium: 'x24',
	large: 'x28',
} as const;

const getVariantClass = (variant: string) => {
	if (variant) {
		const variantClass = [`rcx-button--icon-${[variant].filter(Boolean).join('-')}`];
		return variantClass;
	}
	return [''];
};

const getPressedClass = (variant: string) => {
	const variantClass = [`rcx-button--icon-${[variant].filter(Boolean).join('-')}-pressed`];
	return variantClass;
};

function IconButton({
	icon,
	badge,
	badgePosition = 'top-end',
	variant: variantProp,
	size: sizeProp,
	primary,
	info,
	secondary,
	danger,
	warning,
	success,
	mini,
	large,
	tiny,
	small,
	medium,
	pressed,
	is = 'button',
	external,
	color,
	children,
	...props
}: IconButtonProps) {
	const variant = useMemo(
		() =>
			(variantProp === 'primary' ? 'secondary-info' : variantProp) ||
			(secondary && danger && 'secondary-danger') ||
			(secondary && warning && 'secondary-warning') ||
			(secondary && success && 'secondary-success') ||
			(secondary && info && 'secondary-info') ||
			(info && 'info') ||
			(success && 'success') ||
			(warning && 'warning') ||
			(danger && 'danger') ||
			(primary && 'secondary-info') ||
			(secondary && 'secondary') ||
			'',
		[variantProp, danger, info, primary, secondary, success, warning],
	);

	const kindAndVariantProps = useMemo(() => {
		const variantProp = {} as any;
		if (variant) {
			variantProp[`${getVariantClass(variant)}`] = true;
		}
		if (pressed) {
			variantProp[`${getPressedClass(variant)}`] = true;
		}
		return variantProp;
	}, [variant, pressed]);

	const size = useMemo(
		() => sizeProp || (mini && 'mini') || (tiny && 'tiny') || (small && 'small') || (medium && 'medium') || (large && 'large') || 'large',
		[sizeProp, medium, mini, small, tiny, large],
	);

	const getSizeClass = () => ({ [`rcx-button--${size}-square`]: true });

	const getIconSize = () =>
		(sizeProp && iconSizes[sizeProp]) ||
		(large && 'x28') ||
		(medium && 'x24') ||
		(small && 'x20') ||
		(tiny && 'x16') ||
		(mini && 'x12') ||
		'x28';

	return (
		<Box
			is={is}
			{...(is === 'a'
				? { rel: external ? 'noopener noreferrer' : undefined, target: external ? '_blank' : undefined }
				: { type: 'button' })}
			rcx-button
			rcx-button--icon
			rcx-button--square
			{...kindAndVariantProps}
			{...getSizeClass()}
			rcx-button--icon-pressed={pressed}
			rcx-button--with-badge={Boolean(badge)}
			color={color}
			{...props}
		>
			{isValidElement<any>(icon) ? icon : <Icon name={icon} size={getIconSize()} />}
			{Boolean(badge) && (
				<span className={`rcx-button__badge rcx-button__badge--${badgePosition}`} aria-hidden='true'>
					{badge}
				</span>
			)}
			{children}
		</Box>
	);
}

export default IconButton;
