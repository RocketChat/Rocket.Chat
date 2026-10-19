import { styled, View, type GetProps } from '@tamagui/web';
import type { ElementType, ReactNode, RefAttributes } from 'react';
import { createElement } from 'react';

import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontFamily, size } from '../../styleTokens';
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
	maxHeight: '100%',
	margin: toCSSValue('--rcx-modal-margin', 'auto'),
	padding: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
	backgroundColor: 'transparent',
	backgroundImage: 'none',
	...modalBoxFont,
});

const Modal = ({ children, wrapper = Box, wrapperFunction, ...props }: ModalProps) => {
	const wrapperProps = {
		children,
		className: 'rcx-modal__inner',
		elevation: '2',
	} as const;

	const frameProps = useTamaguiBoxProps(props, 'rcx-modal');

	return (
		<ModalFrame {...({ 'open': true, 'aria-modal': 'true', ...frameProps } as GetProps<typeof ModalFrame>)}>
			{wrapperFunction ? wrapperFunction(wrapperProps) : createElement(wrapper, wrapperProps)}
		</ModalFrame>
	);
};

export default withFuselageProvider(Modal);
