import type { ElementType, ReactNode, RefAttributes } from 'react';
import { createElement } from 'react';

import { Box, type BoxProps } from '../Box';

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
