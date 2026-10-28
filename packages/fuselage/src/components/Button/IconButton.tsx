import type { Keys as IconName } from '@rocket.chat/icons';
import { styled, View } from '@tamagui/web';
import type { AllHTMLAttributes, ComponentType, ReactElement, ReactNode, RefAttributes } from 'react';
import { isValidElement, useContext } from 'react';

import { buttonBadgeStyle, iconButtonFrameStyle } from './ButtonFrame';
import { getButtonStates, variantKey } from './buttonStates';
import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/withFuselageProvider';
import { Icon } from '../Icon';
import { ButtonSegmentContext } from './ButtonSegmentContext';
import type { ButtonKind } from './buttonColors';

// Declared where they render: zero-runtime only erases a `styled()` whose every use is in its own module
const ButtonFrame = styled(View, iconButtonFrameStyle);
const ButtonBadge = styled(View, buttonBadgeStyle);

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

const kindByVariant: Record<string, ButtonKind> = {
	'secondary': 'secondary',
	'info': 'icon-info',
	'success': 'icon-success',
	'warning': 'icon-warning',
	'danger': 'icon-danger',
	'secondary-info': 'primary',
	'secondary-success': 'success',
	'secondary-warning': 'warning',
	'secondary-danger': 'danger',
};

function IconButton({
	icon,
	badge,
	badgePosition = 'top-end',
	variant: variantProp,
	size = 'large',
	pressed,
	children,
	is = 'button',
	external,
	color,
	disabled,
	className,
	...props
}: IconButtonProps) {
	// `secondary-info` is the class that paints the primary palette.
	const variant = variantProp === 'primary' ? 'secondary-info' : (variantProp ?? '');

	const segment = useContext(ButtonSegmentContext);

	const states = getButtonStates(kindByVariant[variant] ?? 'icon', disabled, segment, pressed);

	// The caller's attributes and `disabled` go on the element `render` names: zero-runtime rejects spreads on a frame,
	// and Tamagui would add `aria-disabled` to a frame's `disabled`
	// One element type for both tags: the caller's attributes type-check against neither alone
	const Tag = is as unknown as ComponentType<Record<string, unknown>>;
	const attributes = {
		...(is === 'a'
			? { rel: external ? 'noopener noreferrer' : undefined, target: external ? '_blank' : undefined }
			: { type: 'button' as const }),
		...props,
	};

	return (
		<ButtonFrame
			render={<Tag {...attributes} disabled={disabled} />}
			squareSize={size}
			layer={variantKey(Boolean(badge), states.segment)}
			paint={variantKey(states.look, states.ghost, color)}
			className={cx(
				'rcx-button',
				'rcx-button--icon',
				'rcx-button--square',
				variant && `rcx-button--icon-${variant}`,
				pressed && `rcx-button--icon-${variant}-pressed`,
				`rcx-button--${size}-square`,
				pressed && 'rcx-button--icon-pressed',
				Boolean(badge) && 'rcx-button--with-badge',
				className,
			)}
		>
			{isValidElement<any>(icon) ? icon : <Icon name={icon} size={iconSizes[size]} />}
			{Boolean(badge) && (
				<ButtonBadge className={`rcx-button__badge rcx-button__badge--${badgePosition}`} badgePosition={badgePosition} aria-hidden>
					{badge}
				</ButtonBadge>
			)}
			{children}
		</ButtonFrame>
	);
}

export default withFuselageProvider(IconButton, { takesBoxTransforms: true });
