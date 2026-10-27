import type { Keys as IconName } from '@rocket.chat/icons';
import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactElement, ReactNode, RefAttributes } from 'react';
import { isValidElement, useContext } from 'react';

import { ButtonBadge, ButtonFrame, getButtonStates, renderButtonElement } from './ButtonFrame';
import { cx } from '../../helpers/composeClassNames';
import { resolveFontColor } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon } from '../Icon';
import { ButtonSegmentContext } from './ButtonSegmentContext';
import type { ButtonKind } from './buttonColors';

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

	return (
		<ButtonFrame
			square
			icon
			squareSize={size}
			withBadge={Boolean(badge)}
			render={renderButtonElement(is, disabled)}
			{...(is === 'a'
				? { rel: external ? 'noopener noreferrer' : undefined, target: external ? '_blank' : undefined }
				: { type: 'button' })}
			{...(props as GetProps<typeof ButtonFrame>)}
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
			{...getButtonStates(kindByVariant[variant] ?? 'icon', disabled, segment, pressed)}
			{...(color && { color: resolveFontColor(color) })}
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
