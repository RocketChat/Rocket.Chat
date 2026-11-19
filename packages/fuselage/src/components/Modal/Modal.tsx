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
	/** Renders the element `wrapper` would, from the same props; it takes precedence over `wrapper`. */
	wrapperFunction?: (props: Pick<BoxProps, 'elevation' | 'className' | 'children'>) => ReactNode;
	/**
	 * Element the modal's sections sit in, such as a `form` that the footer's submit button submits. It receives
	 * `elevation`, `className` and `children`.
	 */
	wrapper?: ElementType<Pick<BoxProps, 'elevation' | 'className' | 'children'>>;
};

/**
 * Interrupts the page with a prompt or information the user deals with before going back to it: a decision, a
 * confirmation, critical information or a workflow. Show it over a `ModalBackdrop`.
 */
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
