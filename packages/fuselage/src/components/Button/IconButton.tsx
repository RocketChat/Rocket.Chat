import type { Keys as IconName } from '@rocket.chat/icons';
import type { AllHTMLAttributes, ReactElement, ReactNode, RefAttributes } from 'react';
import { isValidElement, useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Icon } from '../Icon';

export type IconButtonProps = {
	/** An icon name, or an element shown in place of the glyph, such as an `Avatar` or an emoji. */
	icon: IconName | ReactElement<any>;
	/**
	 * Pinned to the button's corner, usually a `Badge`. It is hidden from assistive technology, so repeat what it says
	 * in `aria-label`.
	 */
	badge?: ReactNode;
	badgePosition?: 'top-end' | 'bottom-end';
	/**
	 * Without a variant, the button has no background until hovered. `info`, `success`, `warning` and `danger` color
	 * only the glyph; `primary`, `secondary` and the `secondary-*` variants fill the button.
	 */
	variant?:
		'primary' | 'secondary' | 'info' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	/** Match the size of the surrounding buttons and inputs. */
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	/** Holds the pressed look, for a toggle that is on. It changes only the look: set `aria-pressed` too. */
	pressed?: boolean;
	/** Renders a link instead of a button, for actions that navigate or download. */
	is?: 'button' | 'a';
	/** Opens the link in a new tab, without giving it access to this page. */
	external?: boolean;
	/** Paints the glyph with a font token, for icon-only actions on light surfaces. */
	color?: 'default' | 'danger';
} & Omit<ElementProps<HTMLButtonElement | HTMLAnchorElement, AllHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>>, 'ref'> &
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

/**
 * Triggers an action shown by an icon alone, where a recognizable icon needs no label, as in toolbars and action bars.
 * Name it with `aria-label`.
 */
function IconButton({
	icon,
	badge,
	badgePosition = 'top-end',
	variant: variantProp,
	size = 'large',
	pressed,
	is = 'button',
	external,
	color,
	children,
	...props
}: IconButtonProps) {
	// `secondary-info` is the class that paints the primary palette.
	const variant = variantProp === 'primary' ? 'secondary-info' : (variantProp ?? '');

	const kindAndVariantProps = useMemo(() => {
		const variantProp: Record<string, boolean> = {};
		if (variant) {
			variantProp[String(getVariantClass(variant))] = true;
		}
		if (pressed) {
			variantProp[String(getPressedClass(variant))] = true;
		}
		return variantProp;
	}, [variant, pressed]);

	const getSizeClass = () => ({ [`rcx-button--${size}-square`]: true });

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
			{isValidElement<any>(icon) ? icon : <Icon name={icon} size={iconSizes[size]} />}
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
