import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';
import { useContext } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { ButtonContent, ButtonFrame, getButtonStates, renderButtonElement } from './ButtonFrame';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon, type IconProps } from '../Icon';
import { ButtonSegmentContext } from './ButtonSegmentContext';

export type ButtonProps = Omit<BoxProps, 'ref' | 'is'> & {
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
} & Omit<AllHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>, 'is' | 'className' | 'size'> &
	RefAttributes<HTMLButtonElement | HTMLAnchorElement>;

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

	const kind =
		variant ||
		(primary && 'primary') ||
		(secondary && success && 'secondary-success') ||
		(secondary && warning && 'secondary-warning') ||
		(secondary && danger && 'secondary-danger') ||
		(success && 'success') ||
		(warning && 'warning') ||
		(danger && 'danger') ||
		(secondary && 'secondary') ||
		undefined;

	const effectiveSize =
		size || (mini && 'mini') || (tiny && 'tiny') || (small && 'small') || (medium && 'medium') || (large && 'large') || undefined;

	const transform = useBoxTransform();
	const segment = useContext(ButtonSegmentContext);

	// `<Box is={Button}>` hands over `rcx-box--full`, whose unlayered reset would beat the frame's padding
	if (typeof props.className === 'string') {
		props.className = props.className.replace(/(^|\s)rcx-box--full(?=\s|$)/g, '');
	}

	const frameProps = useTamaguiBoxProps(
		(transform ?? ((props) => props))({
			'rcx-button': true,
			...(kind && { [`rcx-button--${kind}`]: true }),
			'rcx-button--small': effectiveSize === 'small',
			'rcx-button--medium': effectiveSize === 'medium',
			'rcx-button--large': effectiveSize === 'large',
			'rcx-button--square': square,
			'rcx-button--compact': compact,
			'rcx-button--tiny-square': effectiveSize === 'tiny' && square,
			'rcx-button--mini-square': effectiveSize === 'mini' && square,
			'rcx-button--small-square': effectiveSize === 'small' && square,
			'rcx-button--medium-square': effectiveSize === 'medium' && square,
			'rcx-button--large-square': effectiveSize === 'large' && square,
			'rcx-button--loading': loading,
			ref,
			...extraProps,
			...props,
		}),
	);

	const squareSize = square && effectiveSize && effectiveSize !== 'large' ? effectiveSize : undefined;

	const button = (
		<ButtonFrame
			size={effectiveSize === 'small' || effectiveSize === 'medium' || effectiveSize === 'large' ? effectiveSize : undefined}
			compact={compact}
			square={square}
			squareSize={squareSize}
			render={renderButtonElement(is, disabled || loading)}
			{...(frameProps as GetProps<typeof ButtonFrame>)}
			{...getButtonStates(frameProps.className, kind ?? 'secondary', disabled || loading, segment)}
		>
			<ButtonContent className='rcx-button--content'>
				{icon && !loading && <Icon className='rcx-button__icon' size='x16' name={icon} />}
				{loading && <Icon className='rcx-button__icon' size='x16' name='loading' />}
				{children}
			</ButtonContent>
		</ButtonFrame>
	);

	return transform ? <BoxTransforms.Provider value={null}>{button}</BoxTransforms.Provider> : button;
}

export default withFuselageProvider(Button);
