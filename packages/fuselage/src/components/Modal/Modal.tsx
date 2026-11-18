import type { DialogHTMLAttributes, ElementType, ReactNode } from 'react';
import { createElement } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

/** A Fuselage size (`x480`) or a length in pixels. */
export type ModalSize = `x${number}` | number;

export type ModalProps = ElementProps<Element, DialogHTMLAttributes<HTMLDialogElement>> & {
	/** A fixed width, for content that needs it instead of the default fluid one. */
	width?: ModalSize;
	/** A fixed height, for content that has no intrinsic height (e.g. an iframe). */
	height?: ModalSize;
	/** A maximum height, past which the content scrolls, for content taller than the default limit allows. */
	maxHeight?: ModalSize;
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
