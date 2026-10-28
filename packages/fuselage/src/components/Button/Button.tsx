import { styled, Text, View } from '@tamagui/web';
import type { AllHTMLAttributes, ComponentType } from 'react';
import { useContext } from 'react';

import { buttonContentStyle, buttonFrameStyle } from './ButtonFrame';
import { getButtonStates, variantKey } from './buttonStates';
import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/withFuselageProvider';
import { Icon, type IconProps } from '../Icon';
import { ButtonSegmentContext } from './ButtonSegmentContext';

// Declared where they render: zero-runtime only erases a `styled()` whose every use is in its own module
const ButtonFrame = styled(View, buttonFrameStyle);
const ButtonContent = styled(Text, buttonContentStyle);

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

	const segment = useContext(ButtonSegmentContext);

	// `<Box is={Button}>` hands over `rcx-box--full`, whose unlayered reset would beat the frame's padding
	const className = rawClassName?.replace(/(^|\s)rcx-box--full(?=\s|$)/g, '');

	const squareSize = square && size && size !== 'large' ? size : undefined;
	const states = getButtonStates(variant ?? 'secondary', disabled || loading, segment);

	// The caller's attributes and `disabled` go on the element `render` names: zero-runtime rejects spreads on a frame,
	// and Tamagui would add `aria-disabled` to a frame's `disabled`
	// One element type for both tags: the caller's attributes type-check against neither alone
	const Tag = is as unknown as ComponentType<Record<string, unknown>>;
	const attributes = {
		...(is === 'a'
			? { rel: rel ?? (external ? 'noopener noreferrer' : undefined), target: external ? '_blank' : undefined }
			: { type: 'button' as const }),
		...props,
	};

	return (
		<ButtonFrame
			render={<Tag {...attributes} ref={ref} disabled={disabled || loading} />}
			sizing={variantKey(size === 'small' || size === 'medium' || size === 'large' ? size : undefined, compact, square, squareSize)}
			segment={states.segment}
			paint={variantKey(states.look, states.ghost)}
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
