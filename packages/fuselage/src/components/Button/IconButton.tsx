import type { Keys as IconName } from '@rocket.chat/icons';
import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactElement, ReactNode, RefAttributes } from 'react';
import { isValidElement, useContext, useMemo } from 'react';

import { ButtonBadge, ButtonFrame, getButtonStates, renderButtonElement } from './ButtonFrame';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon } from '../Icon';
import { ButtonSegmentContext } from './ButtonSegmentContext';
import type { ButtonKind } from './buttonColors';

export type IconButtonSize = {
	large?: boolean;
	medium?: boolean;
	small?: boolean;
	tiny?: boolean;
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
	primary?: boolean;
	secondary?: boolean;
	info?: boolean;
	danger?: boolean;
	warning?: boolean;
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
	children,
	is = 'button',
	external,
	color,
	disabled,
	...props
}: IconButtonProps) {
	const variant = useMemo(
		() =>
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
		[danger, info, primary, secondary, success, warning],
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
		() => (mini && 'mini') || (tiny && 'tiny') || (small && 'small') || (medium && 'medium') || (large && 'large') || 'large',
		[medium, mini, small, tiny, large],
	);

	const getSizeClass = () => ({ [`rcx-button--${size}-square`]: true });

	const getIconSize = () => (large && 'x28') || (medium && 'x24') || (small && 'x20') || (tiny && 'x16') || (mini && 'x12') || 'x28';

	const transform = useBoxTransform();
	const segment = useContext(ButtonSegmentContext);

	const frameProps = useTamaguiBoxProps(
		(transform ?? ((props) => props))({
			...(is === 'a' ? { rel: external ? 'noopener noreferrer' : undefined, target: external ? '_blank' : undefined } : { type: 'button' }),
			'rcx-button': true,
			'rcx-button--icon': true,
			'rcx-button--square': true,
			...kindAndVariantProps,
			...getSizeClass(),
			'rcx-button--icon-pressed': pressed,
			'rcx-button--with-badge': Boolean(badge),
			color,
			...props,
		}),
	);

	const button = (
		<ButtonFrame
			square
			icon
			squareSize={size}
			withBadge={Boolean(badge)}
			render={renderButtonElement(is, disabled)}
			{...(frameProps as GetProps<typeof ButtonFrame>)}
			{...getButtonStates(frameProps.className, kindByVariant[variant] ?? 'icon', disabled, segment, pressed)}
		>
			{isValidElement<any>(icon) ? icon : <Icon name={icon} size={getIconSize()} />}
			{Boolean(badge) && (
				<ButtonBadge className={`rcx-button__badge rcx-button__badge--${badgePosition}`} badgePosition={badgePosition} aria-hidden>
					{badge}
				</ButtonBadge>
			)}
			{children}
		</ButtonFrame>
	);

	return transform ? <BoxTransforms.Provider value={null}>{button}</BoxTransforms.Provider> : button;
}

export default withFuselageProvider(IconButton);
