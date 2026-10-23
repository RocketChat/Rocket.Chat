import { css } from '@rocket.chat/css-in-js';
import { styled, View, type GetProps } from '@tamagui/web';
import type { ElementType, ReactNode, RefAttributes } from 'react';
import { createElement } from 'react';

import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useStyle } from '../../hooks/useStyle';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, fontFamily, fontScale, size } from '../../styleTokens';
import { Box, type BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalProps = Omit<BoxProps, 'ref'> &
	RefAttributes<Element> & {
		/** A fixed width, for content that needs it instead of the default fluid one. */
		width?: BoxProps['width'];
		/** A fixed height, for content that has no intrinsic height (e.g. an iframe). */
		height?: BoxProps['height'];
		/** Hides the modal while keeping it, and its state, mounted. */
		hidden?: boolean;
		wrapperFunction?: (props: Pick<BoxProps, 'elevation' | 'className' | 'children'>) => ReactNode;
		wrapper?: ElementType<Pick<BoxProps, 'elevation' | 'className' | 'children'>>;
	};

/** The margin around the header and the footer. */
export const modalContainerMargin = toCSSValue('--rcx-modal-container-margin', size('x24')!);

/** Font settings every `Box` used to carry, restated on frames that hold text. */
export const modalBoxFont = {
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

const ModalFrame = styled(View, {
	render: 'dialog',
	position: 'static',
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	width: '100%',
	maxWidth: { sm: '40rem' },
	maxHeight: '100%',
	margin: toCSSValue('--rcx-modal-margin', 'auto'),
	padding: { default: 0, sm: '1rem' },
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
	backgroundColor: 'transparent',
	backgroundImage: 'none',
	...modalBoxFont,

	variants: {
		// Not `hidden`, which the dialog still needs as an attribute
		isHidden: {
			true: { display: 'none' },
		},
	} as const,
});

// The wrapper is any element a consumer renders, so its look travels as a class name
const innerStyle = css`
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	width: 100%;
	min-width: 0;
	padding: 0;
	color: ${textIconColors['font-default']};
	border-radius: ${toCSSValue('--rcx-modal-border-radius', toCSSValue('--rcx-border-radius-large', borderRadius('large')))};
	background-color: ${surfaceColors['surface-light']};
	letter-spacing: ${fontScale('p2').letterSpacing};
	font-size: ${fontScale('p2').fontSize};
	font-weight: ${fontScale('p2').fontWeight};
	line-height: ${fontScale('p2').lineHeight};
`;

const Modal = ({ children, wrapper = Box, wrapperFunction, hidden, ...props }: ModalProps) => {
	const wrapperProps = {
		children,
		className: `rcx-modal__inner ${useStyle(innerStyle, undefined)}`,
		elevation: '2',
	} as const;

	const frameProps = useTamaguiBoxProps(props, 'rcx-modal');

	return (
		<ModalFrame isHidden={hidden} {...({ 'open': true, 'aria-modal': 'true', hidden, ...frameProps } as GetProps<typeof ModalFrame>)}>
			{wrapperFunction ? wrapperFunction(wrapperProps) : createElement(wrapper, wrapperProps)}
		</ModalFrame>
	);
};

export default withFuselageProvider(Modal, { takesBoxTransforms: true });
