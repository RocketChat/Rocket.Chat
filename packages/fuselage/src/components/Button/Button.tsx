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
	disabled?: boolean;
	loading?: boolean;
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
	className: rawClassName,
	...rest
}: ButtonProps) {
	// `Menu` hands `pressed` to whatever trigger it clones; a `Button` has no pressed look, so it stays off the DOM
	const { pressed: _pressed, ...props } = rest as typeof rest & { pressed?: boolean };

	const extraProps =
		(is === 'a' && {
			rel: rel ?? (external ? 'noopener noreferrer' : undefined),
			target: external ? '_blank' : undefined,
		}) ||
		(is === 'button' && {
			type: 'button',
		}) ||
		{};

	const segment = useContext(ButtonSegmentContext);

	// `<Box is={Button}>` hands over `rcx-box--full`, whose unlayered reset would beat the frame's padding
	const className = rawClassName?.replace(/(^|\s)rcx-box--full(?=\s|$)/g, '');

	const squareSize = square && size && size !== 'large' ? size : undefined;

	return (
		<ButtonFrame
			size={size === 'small' || size === 'medium' || size === 'large' ? size : undefined}
			compact={compact}
			square={square}
			squareSize={squareSize}
			render={renderButtonElement(is, disabled || loading)}
			ref={ref as Ref<TamaguiElement>}
			{...({ ...extraProps, ...props } as GetProps<typeof ButtonFrame>)}
			className={cx(
				'rcx-button',
				variant && `rcx-button--${variant}`,
				size === 'small' && 'rcx-button--small',
				size === 'medium' && 'rcx-button--medium',
				size === 'large' && 'rcx-button--large',
				square && 'rcx-button--square',
				compact && 'rcx-button--compact',
				square && size && `rcx-button--${size}-square`,
				loading && 'rcx-button--loading',
				className,
			)}
			{...getButtonStates(variant ?? 'secondary', disabled || loading, segment)}
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
