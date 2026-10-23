import type { DialogHTMLAttributes, ElementType, ReactNode } from 'react';
import { createElement } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

export type ModalProps = ElementProps<Element, DialogHTMLAttributes<HTMLDialogElement>> & {
	/** A fixed width, for content that needs it instead of the default fluid one. */
	width?: BoxProps['width'];
	/** A fixed height, for content that has no intrinsic height (e.g. an iframe). */
	height?: BoxProps['height'];
	/** A maximum height, past which the content scrolls, for content taller than the default limit allows. */
	maxHeight?: BoxProps['maxHeight'];
	/** Hides the modal while keeping it, and its state, mounted. */
	hidden?: boolean;
	wrapperFunction?: (props: Pick<BoxProps, 'elevation' | 'className' | 'children'>) => ReactNode;
	wrapper?: ElementType<Pick<BoxProps, 'elevation' | 'className' | 'children'>>;
};

const Modal = ({ children, wrapper = Box, wrapperFunction, ...props }: ModalProps) => {
	const wrapperProps = {
		children,
		className: 'rcx-modal__inner',
		elevation: '2',
	} as const;

	return (
		<Box is='dialog' open aria-modal='true' rcx-modal {...props}>
			{wrapperFunction ? wrapperFunction(wrapperProps) : createElement(wrapper, wrapperProps)}
		</Box>
	);
};

export default Modal;
