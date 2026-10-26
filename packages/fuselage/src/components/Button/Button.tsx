import type { GetProps, TamaguiElement } from '@tamagui/web';
import type { AllHTMLAttributes, Ref } from 'react';
import { useContext } from 'react';

import { ButtonContent, ButtonFrame, getButtonStates, renderButtonElement } from './ButtonFrame';
import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon, type IconProps } from '../Icon';
import { ButtonSegmentContext } from './ButtonSegmentContext';

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
	rel,
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
	className: rawClassName,
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

	const segment = useContext(ButtonSegmentContext);

	// `<Box is={Button}>` hands over `rcx-box--full`, whose unlayered reset would beat the frame's padding
	const className = rawClassName?.replace(/(^|\s)rcx-box--full(?=\s|$)/g, '');

	const squareSize = square && effectiveSize && effectiveSize !== 'large' ? effectiveSize : undefined;

	return (
		<ButtonFrame
			size={effectiveSize === 'small' || effectiveSize === 'medium' || effectiveSize === 'large' ? effectiveSize : undefined}
			compact={compact}
			square={square}
			squareSize={squareSize}
			render={renderButtonElement(is, disabled || loading)}
			ref={ref as Ref<TamaguiElement>}
			{...({ ...extraProps, ...props } as GetProps<typeof ButtonFrame>)}
			className={cx(
				'rcx-button',
				kind && `rcx-button--${kind}`,
				effectiveSize === 'small' && 'rcx-button--small',
				effectiveSize === 'medium' && 'rcx-button--medium',
				effectiveSize === 'large' && 'rcx-button--large',
				square && 'rcx-button--square',
				compact && 'rcx-button--compact',
				square && effectiveSize && `rcx-button--${effectiveSize}-square`,
				loading && 'rcx-button--loading',
				className,
			)}
			{...getButtonStates(kind ?? 'secondary', disabled || loading, segment)}
		>
			<ButtonContent className='rcx-button--content'>
				{icon && !loading && <Icon className='rcx-button__icon' size='x16' name={icon} />}
				{loading && <Icon className='rcx-button__icon' size='x16' name='loading' />}
				{children}
			</ButtonContent>
		</ButtonFrame>
	);
}

export default withFuselageProvider(Button, { takesBoxTransforms: true });
