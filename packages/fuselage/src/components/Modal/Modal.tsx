import type { DialogHTMLAttributes, SubmitEventHandler } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

/** A Fuselage size (`x480`) or a length in pixels. */
export type ModalSize = `x${number}` | number;

export type ModalProps = Omit<ElementProps<Element, DialogHTMLAttributes<HTMLDialogElement>>, 'onSubmit'> & {
	/** A fixed width, for content that needs it instead of the default fluid one. */
	width?: ModalSize;
	/** A fixed height, for content that has no intrinsic height (e.g. an iframe). */
	height?: ModalSize;
	/** A maximum height, past which the content scrolls, for content taller than the default limit allows. */
	maxHeight?: ModalSize;
	/** Hides the modal while keeping it, and its state, mounted. */
	hidden?: boolean;
	/** Turns the modal's surface into a form that calls this handler on submit, so a `type='submit'` button inside it confirms the modal. */
	onSubmit?: SubmitEventHandler<HTMLElement>;
	/** The `id` of the form the modal renders when `onSubmit` is given, for controls outside of it that point at it with `form`. */
	formId?: string;
};

const Modal = ({ children, onSubmit, formId, ...props }: ModalProps) => (
	<Box is='dialog' open aria-modal='true' rcx-modal {...props}>
		{onSubmit ? (
			<Box is='form' id={formId} className='rcx-modal__inner' elevation='2' onSubmit={onSubmit}>
				{children}
			</Box>
		) : (
			<Box className='rcx-modal__inner' elevation='2'>
				{children}
			</Box>
		)}
	</Box>
);

export default Modal;
